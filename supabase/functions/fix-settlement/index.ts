
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
    const { sessionId, temporaryId, email } = await req.json();
    
    console.log('Attempting to fix settlement for:', { sessionId, temporaryId, email });
    
    if (!sessionId && !temporaryId && !email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters - need at least one of: sessionId, temporaryId, or email'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // First, try to get the Stripe session if we have a sessionId
    let stripeSessionData = null;
    let stripeTemporaryId = null;
    let stripeCustomerId = null;
    let stripeSubscriptionId = null;
    
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        console.log('Found Stripe session:', {
          id: session.id,
          paymentStatus: session.payment_status,
          temporaryId: session.metadata?.temporaryId,
          customerId: session.customer,
          subscriptionId: session.subscription
        });
        
        stripeSessionData = session;
        stripeTemporaryId = session.metadata?.temporaryId;
        stripeCustomerId = session.customer;
        stripeSubscriptionId = session.subscription;
      } catch (stripeError) {
        console.error('Error retrieving Stripe session:', stripeError);
      }
    }
    
    // Use either the provided temporaryId or the one from Stripe
    const effectiveTemporaryId = temporaryId || stripeTemporaryId;
    
    // Check if we can find an existing settlement
    if (effectiveTemporaryId) {
      const { data: existingSettlement, error: findError } = await supabase
        .from('settlements')
        .select('*')
        .eq('temporary_id', effectiveTemporaryId)
        .maybeSingle();
        
      if (findError) {
        console.error('Error finding settlement by temporaryId:', findError);
      }
      
      if (existingSettlement) {
        console.log('Found existing settlement by temporaryId:', existingSettlement);
        
        // If not marked as paid but we have session data, update it
        if (!existingSettlement.payment_completed && sessionId) {
          const { error: updateError } = await supabase
            .from('settlements')
            .update({
              payment_completed: true,
              stripe_session_id: sessionId,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              paid_at: new Date().toISOString()
            })
            .eq('id', existingSettlement.id);
            
          if (updateError) {
            console.error('Error updating settlement payment status:', updateError);
          } else {
            console.log('Successfully updated settlement payment status');
          }
        }
        
        // Make sure we have a corresponding subscription record
        if (sessionId) {
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('payment_id', sessionId)
            .maybeSingle();
            
          if (!existingSub) {
            const { error: subError } = await supabase
              .from('subscriptions')
              .insert({
                temporary_id: effectiveTemporaryId,
                payment_id: sessionId,
                customer_id: stripeCustomerId,
                is_active: true,
                created_at: new Date().toISOString(),
                starts_at: new Date().toISOString()
              });
              
            if (subError) {
              console.error('Error creating subscription record:', subError);
            } else {
              console.log('Successfully created subscription record');
            }
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Found and updated existing settlement',
            settlement: {
              id: existingSettlement.id,
              temporaryId: effectiveTemporaryId,
              paymentCompleted: existingSettlement.payment_completed
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
    }
    
    // If we get here, we didn't find an existing settlement
    // Create a placeholder settlement if we have enough information
    if (effectiveTemporaryId && sessionId) {
      try {
        const { data: newSettlement, error: createError } = await supabase
          .from('settlements')
          .insert({
            temporary_id: effectiveTemporaryId,
            payment_completed: true,
            stripe_session_id: sessionId,
            stripe_subscription_id: stripeSubscriptionId,
            stripe_customer_id: stripeCustomerId,
            amount: 0, // Placeholder
            type: 'Unknown', // Placeholder
            firm: 'Unknown', // Placeholder
            attorney: 'Unknown', // Placeholder
            location: 'Unknown', // Placeholder
            paid_at: new Date().toISOString(),
            attorney_email: email
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating placeholder settlement:', createError);
          throw createError;
        }
        
        console.log('Created placeholder settlement:', newSettlement.id);
        
        // Also create subscription record
        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            temporary_id: effectiveTemporaryId,
            payment_id: sessionId,
            customer_id: stripeCustomerId,
            is_active: true,
            created_at: new Date().toISOString(),
            starts_at: new Date().toISOString()
          });
          
        if (subError) {
          console.error('Error creating subscription record:', subError);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Created placeholder settlement and subscription',
            settlement: {
              id: newSettlement.id,
              temporaryId: effectiveTemporaryId
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      } catch (createError) {
        console.error('Error creating placeholder settlement:', createError);
      }
    }
    
    // If we get here, we couldn't find or create a settlement
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Could not find or create settlement',
        checked: {
          sessionId,
          temporaryId,
          email,
          stripeTemporaryId
        }
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
