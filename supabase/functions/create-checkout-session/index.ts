
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

    const { temporaryId, returnUrl } = await req.json()

    // Create a Stripe checkout session
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
        temporaryId, // Store the temporary ID in metadata
      },
      success_url: `${returnUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(returnUrl).origin}/submit`,
    })

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
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
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
