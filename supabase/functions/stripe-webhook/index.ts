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
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeKey || !webhookSecret) {
      throw new Error('Missing Stripe configuration');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature found in request');
    }

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Processing completed checkout session:', session);

        const userId = session.metadata?.userId;
        const temporaryId = session.metadata?.temporaryId;
        const customerId = session.customer;

        if (!userId && !temporaryId) {
          throw new Error('No user ID or temporary ID found in session metadata');
        }

        // Connect to Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Missing Supabase configuration');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Create a new subscription record
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            temporary_id: temporaryId,
            starts_at: new Date().toISOString(),
            is_active: true,
            payment_id: session.payment_intent,
            customer_id: customerId, // Store the customer ID for future use
          });

        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
          throw subscriptionError;
        }

        console.log('Successfully created subscription record with customer ID:', customerId);
        
        // Also update any existing settlement with the customer ID
        if (temporaryId) {
          const { error: settlementError } = await supabase
            .from('settlements')
            .update({ payment_completed: true })
            .eq('temporary_id', temporaryId);
            
          if (settlementError) {
            console.error('Error updating settlement status:', settlementError);
          } else {
            console.log('Successfully marked settlement as paid');
          }
        }
        
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Processing subscription update:', subscription.id, 'Status:', subscription.status);
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Missing Supabase configuration');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get the current period end date
        const currentPeriodEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString() 
          : null;

        // Determine the correct status and end date based on cancellation state
        let updateData = {
          is_active: subscription.status === 'active',
          ends_at: currentPeriodEnd
        };

        // Handle subscription that's marked to cancel at period end
        if (subscription.cancel_at_period_end && subscription.status === 'active') {
          console.log('Subscription is set to cancel at period end:', subscription.id);
          // Keep is_active true but set the ends_at field
          updateData = {
            is_active: true,
            ends_at: currentPeriodEnd
          };
        }
        
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
            .update(updateData)
            .eq('id', subscriptions[0].id);
            
          if (updateError) {
            console.error('Error updating subscription:', updateError);
          } else {
            console.log('Successfully updated subscription for customer', subscription.customer);
          }
        } else {
          // Fallback: try to update by payment_id
          console.log('No subscription found with customer ID, trying by payment_id');
          
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              ...updateData,
              // Also update the customer ID for future reference
              customer_id: subscription.customer
            })
            .eq('payment_id', subscription.latest_invoice);
            
          if (updateError) {
            console.error('Error updating subscription by payment_id:', updateError);
          } else {
            console.log('Successfully updated subscription by payment_id');
          }
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Processing subscription deletion:', subscription.id);
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Missing Supabase configuration');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
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

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
