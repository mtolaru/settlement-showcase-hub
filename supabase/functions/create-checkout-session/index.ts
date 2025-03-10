
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
    console.log('Handling OPTIONS preflight request');
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('Create checkout session function called');
    
    // Validate environment variables
    let supabaseUrl, supabaseKey, stripeKey;
    try {
      const envVars = validateEnvVars();
      supabaseUrl = envVars.supabaseUrl;
      supabaseKey = envVars.supabaseKey;
      stripeKey = envVars.stripeKey;
      console.log('Environment variables validated successfully');
    } catch (envError) {
      console.error('Environment variable validation failed:', envError);
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error', 
          details: envError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Return 200 to avoid CORS issues
        }
      );
    }
    
    // Create clients
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(), // Use Fetch HTTP client explicitly
    });

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data parsed successfully:', {
        temporaryId: requestData.temporaryId,
        hasUserId: !!requestData.userId,
        hasFormData: !!requestData.formData
      });
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Return 200 to avoid CORS issues
        }
      );
    }
    
    const { temporaryId, userId, returnUrl: userReturnUrl, formData } = requestData;
    
    if (!temporaryId) {
      console.error('Missing temporaryId in request');
      return new Response(
        JSON.stringify({ error: 'Missing temporaryId in request' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Return 200 to avoid CORS issues
        }
      );
    }
    
    // Determine base URL for this request
    const baseUrl = resolveBaseUrl(req);
    console.log('Base URL resolved:', baseUrl);
    
    // Create checkout session
    let result;
    try {
      console.log('Creating checkout session...');
      result = await createCheckoutSession(stripe, supabase, requestData, baseUrl);
      console.log('Checkout session created successfully');
    } catch (checkoutError) {
      console.error('Error creating checkout session:', checkoutError);
      return new Response(
        JSON.stringify({ 
          error: checkoutError.message,
          details: checkoutError.stack || 'No stack trace available'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Return 200 to avoid CORS issues
        }
      );
    }
    
    // If settlement already exists with payment completed
    if (result.isExisting) {
      console.log('Settlement already exists with payment completed');
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
    try {
      console.log('Saving session details...');
      await saveSessionDetails(
        supabase,
        session,
        temporaryId,
        userId,
        successUrl,
        cancelUrl,
        baseUrl
      );
      console.log('Session details saved successfully');
    } catch (saveError) {
      console.error('Error saving session details:', saveError);
      // Continue even if saving details fails - we already have the session URL
    }

    console.log('Returning session URL:', session.url ? session.url.substring(0, 30) + '...' : 'undefined');
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
    console.error('Unhandled error in create-checkout-session:', error);
    
    // Create a more detailed error response
    const errorResponse = {
      error: error.message || 'Unknown error',
      details: error.stack || 'No stack trace available',
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200 // Return 200 to avoid CORS issues
      }
    );
  }
});
