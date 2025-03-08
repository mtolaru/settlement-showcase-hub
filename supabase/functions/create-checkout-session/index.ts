
// Follow this setup guide to integrate the Deno runtime and your Supabase project:
// https://supabase.com/docs/guides/functions/connect-to-supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get and validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    // Log environment variable availability (not values for security)
    console.log('Environment check:', {
      supabaseUrlAvailable: !!supabaseUrl,
      supabaseKeyAvailable: !!supabaseKey,
      stripeKeyAvailable: !!stripeKey
    });
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    }
    
    if (!stripeKey) {
      throw new Error('Missing Stripe configuration. STRIPE_SECRET_KEY must be set.');
    }
    
    // Create clients
    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Parse request body
    const { temporaryId, userId, returnUrl } = await req.json();
    
    // Get the origin for this request
    const requestOrigin = req.headers.get('origin');
    
    // Determine the environment based on the request origin
    const isProduction = requestOrigin?.includes('settlementwins.com') || 
                         requestOrigin?.includes('vercel.app') ||
                         false;
    
    console.log("Environment detection:", { 
      requestOrigin: requestOrigin || 'unknown', 
      isProduction 
    });
    
    // Set appropriate base URL based on environment
    let baseUrl = isProduction 
      ? 'https://www.settlementwins.com'
      : (requestOrigin || 'http://localhost:5173');
    
    // Make sure we have a valid return URL
    let validatedReturnUrl = returnUrl;
    if (!validatedReturnUrl) {
      validatedReturnUrl = `${baseUrl}/confirmation`;
    }
    
    // Set cancel URL based on same base URL
    const cancelUrl = `${baseUrl}/submit?step=3&canceled=true`;

    console.log("Creating checkout session with params:", { 
      temporaryId, 
      userId, 
      returnUrl: validatedReturnUrl,
      cancelUrl,
      baseUrl,
      origin: requestOrigin || 'unknown'
    });
    
    // Properly encode the temporaryId for URL usage
    const encodedTempId = encodeURIComponent(temporaryId);

    // Create the checkout session with properly encoded URLs
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
      success_url: `${validatedReturnUrl}?session_id={CHECKOUT_SESSION_ID}&temporaryId=${encodedTempId}`,
      cancel_url: cancelUrl,
      client_reference_id: temporaryId,
      metadata: {
        temporaryId: temporaryId,
        userId: userId || '',
      },
      allow_promotion_codes: true, // Enable promotion codes
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
    
    // Create a more detailed error response
    const errorResponse = {
      error: error.message,
      details: error.stack,
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorResponse),
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
