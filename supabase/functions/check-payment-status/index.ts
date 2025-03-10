
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
    const { session_id, temporary_id } = await req.json();
    
    console.log('Checking payment status for:', { session_id, temporary_id });
    
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
    
    // Check if we have an existing subscription with this payment ID
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('payment_id', session_id)
      .maybeSingle();
      
    if (existingSubscription) {
      console.log('Found existing subscription:', existingSubscription);
      
      // Return success
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Subscription already exists for this payment',
          subscription: existingSubscription
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    // Check if the session exists in Stripe
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      
      if (!session) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Session not found in Stripe'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        );
      }
      
      console.log('Found Stripe session:', {
        id: session.id,
        paymentStatus: session.payment_status,
        status: session.status,
        metadata: session.metadata
      });
      
      // Extract metadata
      const sessionTemporaryId = session.metadata?.temporaryId;
      const userId = session.metadata?.userId;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      
      // Use either the provided temporaryId or the one from the session
      const temporaryId = temporary_id || sessionTemporaryId;
      
      if (!temporaryId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No temporary ID available'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
      if (session.payment_status === 'paid') {
        // Session is paid, check/update our database
        
        // First check if a settlement exists
        const { data: settlement } = await supabase
          .from('settlements')
          .select('*')
          .eq('temporary_id', temporaryId)
          .maybeSingle();
          
        if (settlement) {
          // If settlement exists but payment is not marked complete, update it
          if (!settlement.payment_completed) {
            console.log('Updating settlement payment status:', settlement.id);
            
            const { error: updateError } = await supabase
              .from('settlements')
              .update({
                payment_completed: true,
                stripe_session_id: session_id,
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: customerId
              })
              .eq('id', settlement.id);
              
            if (updateError) {
              console.error('Error updating settlement:', updateError);
            } else {
              console.log('Successfully updated settlement payment status');
            }
          }
          
          // Make sure we have a subscription record
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('payment_id', session_id)
            .maybeSingle();
            
          if (!existingSub) {
            console.log('Creating missing subscription record');
            
            const { error: subError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: userId || null,
                temporary_id: temporaryId,
                payment_id: session_id,
                customer_id: customerId,
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
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Payment verified and settlement updated'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        } else {
          // No settlement found - this should be rare
          console.log('No settlement found for temporaryId:', temporaryId);
          
          // Create a placeholder settlement
          try {
            const { data: newSettlement, error: createError } = await supabase
              .from('settlements')
              .insert({
                temporary_id: temporaryId,
                payment_completed: true,
                stripe_session_id: session_id,
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: customerId,
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
            
            console.log('Created placeholder settlement:', newSettlement.id);
            
            // Also create subscription record
            const { error: subError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: userId || null,
                temporary_id: temporaryId,
                payment_id: session_id,
                customer_id: customerId,
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
                message: 'Created placeholder settlement and subscription'
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 
              }
            );
          } catch (createError) {
            console.error('Error creating placeholder settlement:', createError);
            
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Failed to create placeholder settlement'
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500 
              }
            );
          }
        }
      } else {
        // Payment not completed
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Payment not completed',
            status: session.payment_status
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
    } catch (stripeError) {
      console.error('Error retrieving Stripe session:', stripeError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error retrieving Stripe session',
          details: stripeError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
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
