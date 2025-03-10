
// Follow this setup guide to integrate the Deno runtime and your Supabase project:
// https://supabase.com/docs/guides/functions/connect-to-supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get and validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!supabaseUrl || !supabaseKey || !stripeKey) {
      throw new Error('Missing required environment variables');
    }
    
    // Create clients
    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Parse request body
    const { session_id } = await req.json();
    
    if (!session_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing session_id parameter'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    console.log('Checking payment status for session:', session_id);
    
    // First check if we have a record of this session in our stripe_sessions table
    const { data: sessionRecord, error: sessionError } = await supabase
      .from('stripe_sessions')
      .select('*')
      .eq('session_id', session_id)
      .maybeSingle();
      
    if (sessionError) {
      console.error('Error fetching session record:', sessionError);
    } else if (sessionRecord) {
      console.log('Found session record:', sessionRecord);
      
      // Check if the associated settlement exists and is paid
      if (sessionRecord.temporary_id) {
        const { data: settlement, error: settlementError } = await supabase
          .from('settlements')
          .select('*')
          .eq('temporary_id', sessionRecord.temporary_id)
          .maybeSingle();
          
        if (settlementError) {
          console.error('Error fetching settlement:', settlementError);
        } else if (settlement) {
          console.log('Found settlement:', settlement);
          
          if (!settlement.payment_completed) {
            // Update the settlement to mark payment as completed
            const { error: updateError } = await supabase
              .from('settlements')
              .update({ 
                payment_completed: true,
                stripe_session_id: session_id,
                paid_at: new Date().toISOString()
              })
              .eq('id', settlement.id);
              
            if (updateError) {
              console.error('Error updating settlement payment status:', updateError);
            } else {
              console.log('Updated settlement payment status to completed');
            }
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              temporaryId: sessionRecord.temporary_id,
              settlementId: settlement.id,
              payment_completed: true
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        }
      }
    }
    
    // If we don't have a record in our database, check with Stripe
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      
      console.log('Stripe session retrieved:', {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        metadata: session.metadata
      });
      
      if (session.payment_status === 'paid' && session.metadata?.temporaryId) {
        console.log('Session is paid and has temporaryId:', session.metadata.temporaryId);
        
        // Check if the settlement exists
        const { data: settlement, error: settlementError } = await supabase
          .from('settlements')
          .select('*')
          .eq('temporary_id', session.metadata.temporaryId)
          .maybeSingle();
          
        if (settlementError) {
          console.error('Error fetching settlement:', settlementError);
        } else if (settlement) {
          console.log('Found settlement:', settlement);
          
          if (!settlement.payment_completed) {
            // Update the settlement to mark payment as completed
            const { error: updateError } = await supabase
              .from('settlements')
              .update({ 
                payment_completed: true,
                stripe_session_id: session_id,
                stripe_customer_id: session.customer,
                stripe_subscription_id: session.subscription,
                paid_at: new Date().toISOString()
              })
              .eq('id', settlement.id);
              
            if (updateError) {
              console.error('Error updating settlement payment status:', updateError);
            } else {
              console.log('Updated settlement payment status to completed');
            }
          }
          
          // Save this session for future reference
          const { error: saveError } = await supabase
            .from('stripe_sessions')
            .upsert({
              session_id: session.id,
              temporary_id: session.metadata.temporaryId,
              user_id: session.metadata.userId || null,
              created_at: new Date().toISOString(),
              session_data: session
            });
            
          if (saveError) {
            console.error('Error saving session:', saveError);
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              temporaryId: session.metadata.temporaryId,
              settlementId: settlement.id,
              payment_completed: true
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        } else {
          console.log('Settlement not found with temporaryId:', session.metadata.temporaryId);
          
          // Create a basic settlement record if it doesn't exist
          const { data: newSettlement, error: createError } = await supabase
            .from('settlements')
            .insert({
              temporary_id: session.metadata.temporaryId,
              payment_completed: true,
              stripe_session_id: session_id,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              amount: 0, // Placeholder
              type: 'Unknown', // Placeholder
              firm: 'Unknown', // Placeholder
              attorney: 'Unknown', // Placeholder
              location: 'Unknown', // Placeholder
              paid_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating placeholder settlement:', createError);
            throw createError;
          }
          
          console.log('Created placeholder settlement:', newSettlement);
          
          // Save this session for future reference
          const { error: saveError } = await supabase
            .from('stripe_sessions')
            .upsert({
              session_id: session.id,
              temporary_id: session.metadata.temporaryId,
              user_id: session.metadata.userId || null,
              created_at: new Date().toISOString(),
              session_data: session
            });
            
          if (saveError) {
            console.error('Error saving session:', saveError);
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              temporaryId: session.metadata.temporaryId,
              settlementId: newSettlement.id,
              payment_completed: true,
              note: 'Created placeholder settlement'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        }
      }
    } catch (stripeError) {
      console.error('Error retrieving Stripe session:', stripeError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Could not verify payment or find associated settlement.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      }
    );
  } catch (error) {
    console.error('General error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
