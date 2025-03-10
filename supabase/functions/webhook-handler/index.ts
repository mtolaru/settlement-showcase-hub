
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno"; // Newer version

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Webhook function invoked");
    
    // Get the raw body for signature verification
    const body = await req.text();
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
    
    // Create clients
    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    
    // Log basic info about the request
    console.log("Request details:", {
      method: req.method,
      url: req.url,
      hasSignature: !!req.headers.get('stripe-signature'),
      bodyLength: body.length
    });
    
    // Verify and parse the event
    let event;
    
    try {
      // Get the signature from headers
      const signature = req.headers.get('stripe-signature');
      
      if (signature && webhookSecret) {
        try {
          // Use constructEventAsync to avoid microtask issues
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret
          );
          console.log("Event verified successfully");
        } catch (verifyError) {
          console.error("Signature verification failed:", verifyError.message);
          return new Response(
            JSON.stringify({ error: 'Webhook signature verification failed' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        // For testing, just parse the body as JSON
        console.log("No signature or secret, parsing as JSON");
        event = JSON.parse(body);
      }
    } catch (parseError) {
      console.error("Failed to parse webhook body:", parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log the event type
    console.log("Processing webhook event:", event.type, "ID:", event.id);
    
    // Handle different event types
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Extract important data
      const temporaryId = session.metadata?.temporaryId;
      const userId = session.metadata?.userId;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      
      console.log("Checkout session completed:", {
        sessionId: session.id,
        temporaryId,
        userId,
        customerId,
        subscriptionId
      });
      
      if (!temporaryId) {
        console.error("No temporaryId found in session metadata");
        return new Response(
          JSON.stringify({ error: 'Missing temporaryId in session metadata' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Update the settlement
      try {
        const { data, error } = await supabase
          .from('settlements')
          .update({ 
            payment_completed: true,
            stripe_session_id: session.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            paid_at: new Date().toISOString()
          })
          .eq('temporary_id', temporaryId)
          .select()
          .single();
          
        if (error) {
          console.error("Error updating settlement:", error);
        } else if (data) {
          console.log("Settlement updated successfully:", data.id);
        } else {
          console.log("No settlement found with temporaryId:", temporaryId);
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
      }
      
      // Create a subscription record
      try {
        await supabase
          .from('subscriptions')
          .insert({
            user_id: userId || null,
            temporary_id: temporaryId,
            customer_id: customerId,
            payment_id: session.id,
            is_active: true,
            starts_at: new Date().toISOString()
          });
          
        console.log("Subscription record created");
      } catch (subError) {
        console.error("Error creating subscription record:", subError);
      }
    } else if (event.type === 'invoice.paid') {
      console.log("Invoice paid event received, but not implemented yet");
    }
    
    // Return a success response
    return new Response(
      JSON.stringify({ 
        received: true,
        event_id: event.id,
        event_type: event.type
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Unhandled error in webhook:", error);
    
    // Always return 200 to prevent Stripe retries
    return new Response(
      JSON.stringify({ 
        error: 'Unhandled error', 
        message: error.message
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
