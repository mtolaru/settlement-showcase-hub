
// Follow this setup guide to integrate the Deno runtime and your Supabase project:
// https://supabase.com/docs/guides/functions/connect-to-supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyWebhookSignature } from "./utils/stripe-utils.ts";
import { handleWebhookEvent } from "./handlers/webhook-handler.ts";
import { corsHeaders } from "./utils/cors-headers.ts";
import { createSupabaseClient } from "./utils/supabase-client.ts";
import { validateEnvVars } from "./utils/env-validator.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log webhook request details for better debugging
    console.log(`Webhook request received from: ${req.headers.get('origin') || 'unknown origin'}`);
    console.log(`Request URL: ${req.url}`);
    console.log(`Host header: ${req.headers.get('host')}`);
    console.log(`User-Agent: ${req.headers.get('user-agent')}`);
    
    // Validate environment variables
    const envVars = validateEnvVars();
    
    // Get the signature from the headers with enhanced logging
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('No Stripe signature found in request headers');
      console.log('Available headers:', [...req.headers.keys()].join(', '));
      
      return new Response(
        JSON.stringify({ 
          error: 'No stripe-signature header found', 
          availableHeaders: [...req.headers.keys()],
          message: 'This webhook endpoint requires a valid Stripe signature',
          receivedAt: new Date().toISOString()
        }),
        { 
          status: 200, // Return 200 instead of 400 to avoid Stripe retries
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.text();
    
    // Log detailed debugging information
    console.log(`Webhook received with signature: ${signature.substring(0, 10)}...`);
    console.log(`Body preview: ${body.substring(0, 100)}...`);
    
    // Verify the webhook signature
    const event = await verifyWebhookSignature(body, signature, envVars.webhookSecret);
    
    // Create Supabase client
    const supabase = createSupabaseClient(envVars.supabaseUrl, envVars.supabaseKey);

    // Process the webhook event with improved logging
    console.log(`Processing event type: ${event.type}, event ID: ${event.id}`);
    console.log(`Event received timestamp: ${new Date().toISOString()}`);
    
    if (event.data?.object?.metadata?.temporaryId) {
      console.log(`Event contains temporaryId: ${event.data.object.metadata.temporaryId}`);
    }
    
    // Add more specific logging for the event types we care about
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      console.log(`Invoice payment event details:`, {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        subscriptionId: invoice.subscription,
        status: invoice.status,
        total: invoice.total
      });
    }
    
    await handleWebhookEvent(event, supabase);

    // Return a success response to Stripe with detailed information
    return new Response(
      JSON.stringify({ 
        received: true, 
        success: true, 
        event_type: event.type,
        processed_at: new Date().toISOString(),
        event_id: event.id,
        supabase_connection: "success"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Webhook general error:', error);
    // Provide more detailed error information but return 200 to prevent Stripe from retrying
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString(),
        received: true // Tell Stripe we received the webhook
      }),
      { 
        status: 200, // Always return 200 to Stripe
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
