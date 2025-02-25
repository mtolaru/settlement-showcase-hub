
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

  const STRIPE_KEY = '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';

  try {
    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Test 1: Check if we can list prices
    console.log('Testing price listing...');
    const prices = await stripe.prices.list({
      limit: 1,
    });

    // Test 2: Try to create a checkout session
    console.log('Testing checkout session creation...');
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
            unit_amount: 19900,
            product_data: {
              name: 'Test Product',
              description: 'Test subscription',
            },
          },
          quantity: 1,
        },
      ],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    });

    return new Response(
      JSON.stringify({ 
        message: 'All permission tests passed successfully!',
        pricesAccess: true,
        checkoutAccess: true
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Permission test error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        pricesAccess: false,
        checkoutAccess: false
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
