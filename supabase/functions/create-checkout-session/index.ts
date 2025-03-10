
// Follow this setup guide to integrate the Deno runtime and your Supabase project:
// https://supabase.com/docs/guides/functions/connect-to-supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno';
import { corsHeaders } from "./utils/cors-headers.ts";
import { validateEnvVars } from "./utils/env-validator.ts";
import { resolveBaseUrl } from "./utils/url-resolver.ts";
import { createSupabaseClient } from "./utils/supabase-client.ts";
import { createCheckoutSession, saveSessionDetails } from "./utils/checkout-session.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Validate environment variables
    const { supabaseUrl, supabaseKey, stripeKey } = validateEnvVars();
    
    // Create clients
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    const { temporaryId, userId, returnUrl: userReturnUrl, formData } = requestData;
    
    if (!temporaryId) {
      return new Response(
        JSON.stringify({ error: 'Missing temporaryId in request' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // Determine base URL for this request
    const baseUrl = resolveBaseUrl(req);
    
    // Create checkout session
    let result;
    try {
      result = await createCheckoutSession(stripe, supabase, requestData, baseUrl);
    } catch (checkoutError) {
      console.error('Error creating checkout session:', checkoutError);
      return new Response(
        JSON.stringify({ 
          error: checkoutError.message,
          details: checkoutError.stack
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    // If settlement already exists with payment completed
    if (result.isExisting) {
      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    const { session } = result;
    
    // Define URLs for session log
    const encodedTempId = encodeURIComponent(temporaryId);
    const successUrl = `${baseUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}&temporaryId=${encodedTempId}`;
    const cancelUrl = `${baseUrl}/submit?step=3&canceled=true`;
    
    // Save session details for easier retrieval later
    await saveSessionDetails(
      supabase,
      session,
      temporaryId,
      userId,
      successUrl,
      cancelUrl,
      baseUrl
    );

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
