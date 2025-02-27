
// Follow this setup guide to integrate the Deno runtime and your Supabase project:
// https://supabase.com/docs/guides/functions/connect-to-supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno';

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
    // Create a Supabase client with the Auth context of the function
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Parse request body
    const { temporaryId, userId, returnUrl } = await req.json();
    
    // Make sure we have a valid return URL
    const validatedReturnUrl = returnUrl || `${req.headers.get('origin')}/confirmation`;

    console.log("Creating checkout session with params:", { temporaryId, userId, returnUrl: validatedReturnUrl });

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Professional Plan Subscription',
              description: 'Monthly subscription for publishing settlements',
            },
            unit_amount: 19900, // $199.00
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${validatedReturnUrl}?session_id={CHECKOUT_SESSION_ID}&temporaryId=${temporaryId}`,
      cancel_url: `${req.headers.get('origin')}/submit?step=3&canceled=true`,
      client_reference_id: temporaryId,
      metadata: {
        temporaryId: temporaryId,
        userId: userId || '',
      },
    });

    console.log("Checkout session created:", session.id, "Redirection URL:", session.url);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    );
  }
});
