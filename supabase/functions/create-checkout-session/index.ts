
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Stripe } from "https://esm.sh/stripe@14.14.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Using Deno.env to get the secret key from environment variables
  const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  console.log('Checking for STRIPE_SECRET_KEY...');
  
  if (!STRIPE_KEY) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return new Response(
      JSON.stringify({ error: 'Missing Stripe configuration' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  try {
    console.log('Initializing Stripe...');
    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { temporaryId, returnUrl } = await req.json()
    console.log('Received request with temporaryId:', temporaryId);
    console.log('Return URL:', returnUrl);

    // Create a Stripe checkout session
    console.log('Creating checkout session...');
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            recurring: {
              interval: 'month',
            },
            unit_amount: 19900, // $199.00
            product_data: {
              name: 'Professional Plan',
              description: 'Monthly subscription for settlement submissions',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        temporaryId,
      },
      success_url: `${returnUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(returnUrl).origin}/submit`,
    })

    console.log('Checkout session created successfully:', session.id);
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Detailed error in create-checkout-session:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: {
          name: error.name,
          stack: error.stack
        }
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
