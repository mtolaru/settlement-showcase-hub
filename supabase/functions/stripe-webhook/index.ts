
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

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
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('No Stripe signature found in webhook request');
      return new Response('No signature provided', { status: 400 });
    }

    const body = await req.text();
    console.log('Received webhook body:', body);

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed:`, err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log('✓ Webhook signature verified');
    console.log('Processing event type:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session);

        // Check if this is a subscription checkout
        if (session.mode === 'subscription') {
          console.log('Processing subscription checkout...');
          
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          console.log('Retrieved subscription details:', subscription);

          // Get customer details
          const customer = await stripe.customers.retrieve(session.customer);
          console.log('Retrieved customer details:', customer);

          // Store subscription data in Supabase
          const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/subscriptions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              user_id: session.client_reference_id,
              payment_id: subscription.id,
              starts_at: new Date(subscription.current_period_start * 1000).toISOString(),
              ends_at: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
              is_active: subscription.status === 'active',
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            console.error('Failed to store subscription:', error);
            throw new Error(`Failed to store subscription: ${error}`);
          }

          console.log('✓ Successfully stored subscription in Supabase');
        }
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`Processing ${event.type}:`, subscription);

        // Update subscription status in Supabase
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/subscriptions?payment_id=eq.${subscription.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              is_active: subscription.status === 'active',
              ends_at: subscription.current_period_end 
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error('Failed to update subscription:', error);
          throw new Error(`Failed to update subscription: ${error}`);
        }

        console.log('✓ Successfully updated subscription in Supabase');
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(`Webhook Error: ${err.message}`, { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
