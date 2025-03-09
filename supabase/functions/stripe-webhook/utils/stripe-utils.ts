
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";
import { corsHeaders } from "./cors-headers.ts";

// Verify webhook signature and construct event
export const verifyWebhookSignature = async (body: string, signature: string, webhookSecret: string) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    console.log('Successfully verified webhook signature');
    console.log('Processing webhook event:', event.type, 'Event ID:', event.id);
    return event;
  } catch (webhookError) {
    console.error('Webhook signature verification failed:', webhookError);
    
    throw {
      status: 200, // Return 200 instead of 401 to avoid Stripe retries
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Webhook signature verification failed',
        details: webhookError.message,
        received: true
      })
    };
  }
};
