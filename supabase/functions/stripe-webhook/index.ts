
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables with validation
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Log environment variable availability (not their values for security)
    console.log('Environment check:', {
      stripeKeyAvailable: !!stripeKey,
      webhookSecretAvailable: !!webhookSecret,
      supabaseUrlAvailable: !!supabaseUrl,
      supabaseKeyAvailable: !!supabaseKey
    });
    
    if (!stripeKey || !webhookSecret) {
      throw new Error('Missing Stripe configuration. STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be set.');
    }
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature found in request');
    }

    const body = await req.text();
    
    try {
      // Log a portion of the signature and body for debugging
      console.log(`Webhook received with signature: ${signature.substring(0, 10)}...`);
      console.log(`Body preview: ${body.substring(0, 100)}...`);
      console.log(`Body length: ${body.length} characters`);
      
      const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('Processing webhook event:', event.type, 'Event ID:', event.id, 'Live mode:', event.livemode);

      // Connect to Supabase
      const supabase = createClient(supabaseUrl, supabaseKey);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          console.log('Processing completed checkout session:', session.id);

          const userId = session.metadata?.userId;
          const temporaryId = session.metadata?.temporaryId;
          const customerId = session.customer;
          const paymentId = session.payment_intent || session.id; // Fallback to session ID if payment_intent not available

          if (!userId && !temporaryId) {
            throw new Error('No user ID or temporary ID found in session metadata');
          }

          // Create a new subscription record
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              temporary_id: temporaryId,
              starts_at: new Date().toISOString(),
              is_active: true,
              payment_id: paymentId,
              customer_id: customerId, // Store the customer ID for future use
            });

          if (subscriptionError) {
            console.error('Error creating subscription:', subscriptionError);
            throw subscriptionError;
          }

          console.log('Successfully created subscription record with customer ID:', customerId);
          
          // Update any existing settlement with the user ID (if available) and mark as payment completed
          if (temporaryId) {
            let updateData: any = { payment_completed: true };
            
            // If userId is available, also update it
            if (userId) {
              updateData.user_id = userId;
            }
            
            const { error: settlementError } = await supabase
              .from('settlements')
              .update(updateData)
              .eq('temporary_id', temporaryId);
              
            if (settlementError) {
              console.error('Error updating settlement status:', settlementError);
            } else {
              console.log('Successfully marked settlement as paid and assigned user ID (if available)');
            }
          }
          
          // If we have a userId but no temporaryId, update any settlements for this user that aren't marked as completed
          if (userId && !temporaryId) {
            const { error: userSettlementError } = await supabase
              .from('settlements')
              .update({ payment_completed: true })
              .eq('user_id', userId)
              .eq('payment_completed', false);
              
            if (userSettlementError) {
              console.error('Error updating user settlements:', userSettlementError);
            } else {
              console.log('Successfully marked all user settlements as paid');
            }
          }
          
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          console.log('Processing subscription update:', subscription.id, 'Status:', subscription.status);
          
          // Try to find any subscription record with this customer
          const { data: subscriptions, error: findError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('customer_id', subscription.customer)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (findError) {
            console.error('Error finding subscription by customer ID:', findError);
          } else if (subscriptions && subscriptions.length > 0) {
            // Found a subscription with this customer ID, update it
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                is_active: subscription.status === 'active',
                ends_at: subscription.current_period_end 
                  ? new Date(subscription.current_period_end * 1000).toISOString() 
                  : null
              })
              .eq('id', subscriptions[0].id);
              
            if (updateError) {
              console.error('Error updating subscription:', updateError);
            } else {
              console.log('Successfully updated subscription for customer', subscription.customer);
            }
          } else {
            // Fallback: try to update by payment_id if it matches the latest invoice
            console.log('No subscription found with customer ID, trying alternative lookup methods');
            
            if (subscription.latest_invoice) {
              const { error: updateError } = await supabase
                .from('subscriptions')
                .update({
                  is_active: subscription.status === 'active',
                  ends_at: subscription.current_period_end 
                    ? new Date(subscription.current_period_end * 1000).toISOString() 
                    : null,
                  // Also update the customer ID for future reference
                  customer_id: subscription.customer
                })
                .eq('payment_id', subscription.latest_invoice);
                
              if (updateError) {
                console.error('Error updating subscription by invoice:', updateError);
              } else {
                console.log('Successfully updated subscription by invoice reference');
              }
            }
          }
          
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          console.log('Processing subscription deletion:', subscription.id);
          
          // Try to find and update any subscription with this customer ID
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              is_active: false,
              ends_at: new Date().toISOString() // End immediately
            })
            .eq('customer_id', subscription.customer);
            
          if (updateError) {
            console.error('Error marking subscription as inactive:', updateError);
          } else {
            console.log('Successfully marked subscription as inactive for customer', subscription.customer);
          }
          
          break;
        }
      }

      return new Response(JSON.stringify({ received: true, success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (webhookError) {
      console.error('Webhook construction error:', webhookError);
      return new Response(
        JSON.stringify({ error: 'Webhook construction failed: ' + webhookError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Webhook general error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
