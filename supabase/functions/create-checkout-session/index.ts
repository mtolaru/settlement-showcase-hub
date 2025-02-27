
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";

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
    if (!stripeKey) {
      console.error('Missing Stripe secret key');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get request body
    const requestData = await req.json();
    const { temporaryId, userId, returnUrl } = requestData;
    
    if (!returnUrl) {
      console.error('Missing required parameters:', requestData);
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Creating checkout session with:', requestData);

    // For backwards compatibility, accept either direct priceId or default to subscription price
    const priceId = requestData.priceId || 'price_1QwpUFDEE7vEKM2KYdBYUIq6';

    const session = await stripe.checkout.sessions.create({
      success_url: returnUrl,
      cancel_url: `${new URL(returnUrl).origin}/pricing`,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId || temporaryId,
      metadata: {
        userId: userId || temporaryId,
        temporaryId: temporaryId || '',
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Stripe error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
