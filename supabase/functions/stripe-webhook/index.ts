
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature provided', { status: 400 });
    }

    const body = await req.text();
    console.log('Received webhook body:', body);

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log('Processing event type:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session);

        // Check if this is a subscription checkout
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          console.log('Retrieved subscription:', subscription);

          // Store subscription data in Supabase
          const response = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              user_id: session.client_reference_id, // This should be set during checkout
              payment_id: session.id,
              starts_at: new Date(subscription.current_period_start * 1000).toISOString(),
              ends_at: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
              is_active: true,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to store subscription: ${error}`);
          }

          console.log('Successfully stored subscription in Supabase');
        }
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated/deleted:', subscription);

        // Update subscription status in Supabase
        const response = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?payment_id=eq.${subscription.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
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
          throw new Error(`Failed to update subscription: ${error}`);
        }

        console.log('Successfully updated subscription in Supabase');
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
