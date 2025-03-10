
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
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Parse request body
    const requestData = await req.json();
    const { temporaryId, userId, returnUrl: userReturnUrl, formData } = requestData;
    
    // Get the origin for this request - Use all available headers for debugging
    const requestOrigin = req.headers.get('origin');
    const requestUrl = req.url;
    const referrer = req.headers.get('referer');
    const host = req.headers.get('host');
    
    console.log("Request details:", {
      origin: requestOrigin,
      url: requestUrl,
      referrer,
      host,
      temporaryId,
      userId,
      hasFormData: !!formData
    });
    
    // Define allowed production domains - EXPANDED LIST
    const productionDomains = [
      'https://www.settlementwins.com', 
      'https://settlementwins.com',
      'https://settlement-wins-web.vercel.app',
      'https://payment-redirect-preview.vercel.app'
    ];
    
    // Default production domain to use if we can't determine from request
    const defaultProductionDomain = 'https://www.settlementwins.com';
    
    // Determine base URL with improved fallback logic
    let baseUrl;
    
    // First try to get it directly from the origin header - highest priority
    if (requestOrigin && requestOrigin.length > 0) {
      console.log("Using origin header for base URL:", requestOrigin);
      baseUrl = requestOrigin;
    } 
    // If no origin, try to extract from referrer
    else if (referrer && referrer.length > 0) {
      try {
        const referrerUrl = new URL(referrer);
        baseUrl = `${referrerUrl.protocol}//${referrerUrl.host}`;
        console.log("Extracted base URL from referrer:", baseUrl);
      } catch (e) {
        console.log("Failed to extract from referrer, using default production domain");
        baseUrl = defaultProductionDomain;
      }
    } 
    // If we have a host header and URL, try to construct from that
    else if (host && requestUrl) {
      try {
        const urlObj = new URL(requestUrl);
        baseUrl = `${urlObj.protocol}//${host}`;
        console.log("Constructed base URL from host and request URL:", baseUrl);
      } catch (e) {
        console.log("Failed to construct URL from host, falling back to default");
        baseUrl = defaultProductionDomain;
      }
    }
    // Last resort fallback to default production domain
    else {
      console.log("No origin, referrer or host found, using default production domain");
      baseUrl = defaultProductionDomain;
    }
    
    // Sanity check - ensure baseUrl has protocol
    if (!baseUrl.startsWith('http')) {
      console.log("Adding https:// to baseUrl as it's missing protocol:", baseUrl);
      baseUrl = 'https://' + baseUrl;
    }
    
    console.log("Final base URL for redirects:", baseUrl);
    
    // Check if this temporaryId already has a completed payment
    const { data: existingSettlement, error: checkError } = await supabase
      .from('settlements')
      .select('id, payment_completed')
      .eq('temporary_id', temporaryId)
      .eq('payment_completed', true)
      .maybeSingle();

    if (!checkError && existingSettlement?.id) {
      console.log("Found existing settlement with this temporaryId:", existingSettlement.id);
      
      return new Response(
        JSON.stringify({ 
          isExisting: true,
          message: "This settlement has already been processed"
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    // Always use the Supabase function URL for webhook endpoints
    const webhookUrl = `${supabaseUrl}/functions/v1/stripe-webhook`;
    console.log("Webhook URL:", webhookUrl);
    
    // Make sure temporaryId is properly encoded
    const encodedTempId = encodeURIComponent(temporaryId);
    
    // IMPORTANT: Always use /confirmation as the primary success route directly
    const successUrl = `${baseUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}&temporaryId=${encodedTempId}`;
    const cancelUrl = `${baseUrl}/submit?step=3&canceled=true`;
    
    console.log("Success URL:", successUrl);
    console.log("Cancel URL:", cancelUrl);

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
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: temporaryId,
      metadata: {
        temporaryId: temporaryId,
        userId: userId || '',
        baseUrl: baseUrl // Store the base URL in metadata for reference
      },
      allow_promotion_codes: true,
    });

    console.log("Checkout session created:", {
      sessionId: session.id,
      url: session.url,
      successUrl: successUrl,
      temporaryId: temporaryId,
      baseUrl: baseUrl
    });

    // Save session details for easier retrieval later
    try {
      const { error: sessionLogError } = await supabase
        .from('stripe_sessions')
        .insert({
          session_id: session.id,
          temporary_id: temporaryId,
          user_id: userId || null,
          created_at: new Date().toISOString(),
          session_data: {
            payment_status: session.payment_status,
            url: session.url,
            success_url: successUrl,
            cancel_url: cancelUrl,
            base_url: baseUrl
          }
        });
        
      if (sessionLogError) {
        console.error("Error logging session details:", sessionLogError);
      } else {
        console.log("Successfully logged session details");
      }
    } catch (logError) {
      console.error("Exception logging session:", logError);
    }

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
