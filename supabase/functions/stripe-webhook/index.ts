
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
    // Use constructEventAsync instead of constructEvent
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Processing completed checkout session:', session);

        const userId = session.metadata?.userId;
        const temporaryId = session.metadata?.temporaryId;

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
            stripe_subscription_id: session.subscription,
            is_active: true,
            payment_id: session.payment_intent
          });

        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
          throw subscriptionError;
        }

        console.log('Successfully created subscription record');
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

        // Update subscription status
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            is_active: subscription.status === 'active',
            ends_at: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          throw updateError;
        }

        console.log('Successfully updated subscription record for', subscription.id);
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
