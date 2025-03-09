
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/typescript

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@12.0.0?dts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Checking for Stripe subscriptions...");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { userId, email, includeDetails } = payload;
    
    console.log(`Verifying subscription for user ${userId || 'unknown'} with email ${email || 'unknown'}`);
    console.log("Stripe API key available:", !!Deno.env.get("STRIPE_SECRET_KEY"));

    if (!userId && !email) {
      console.error("Missing required parameters: userId or email required");
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // First, try to find a subscription by user_id in our database
    let dbSubscription = null;
    if (userId) {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription from database:", error);
      } else if (data) {
        console.log("Found subscription in database:", data);
        dbSubscription = data;
      }
    }

    // Next, check for Stripe subscription
    let stripeSubscription = null;
    let stripeCustomerId = null;

    // First try to get customer ID from the database subscription
    if (dbSubscription && dbSubscription.customer_id) {
      stripeCustomerId = dbSubscription.customer_id;
      console.log("Using customer ID from database:", stripeCustomerId);
    } 
    // Otherwise look up by email
    else if (email) {
      try {
        console.log("Looking up customer by email:", email);
        const customers = await stripe.customers.list({
          email: email,
          limit: 1,
        });

        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
          console.log("Found Stripe customer by email:", stripeCustomerId);
        } else {
          console.log("No Stripe customer found with email:", email);
        }
      } catch (err) {
        console.error("Error looking up Stripe customer by email:", err);
        console.error("Error details:", err.message);
      }
    }

    // If we have a customer ID, look up their subscriptions
    if (stripeCustomerId) {
      try {
        console.log("Looking up subscriptions for customer:", stripeCustomerId);
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: 'all',
          limit: 10,
          expand: ['data.default_payment_method'],
        });

        console.log(`Found ${subscriptions.data.length} subscriptions for customer ${stripeCustomerId}`);

        // Look for active or recently canceled subscriptions
        const validSubscriptions = subscriptions.data.filter(sub => 
          sub.status === 'active' || 
          sub.status === 'trialing' || 
          (sub.status === 'canceled' && sub.current_period_end * 1000 > Date.now())
        );

        if (validSubscriptions.length > 0) {
          // Sort by end date to get the one that's valid the longest
          validSubscriptions.sort((a, b) => b.current_period_end - a.current_period_end);
          
          const sub = validSubscriptions[0];
          console.log("Using Stripe subscription:", sub.id, "with status:", sub.status);
          
          stripeSubscription = {
            id: sub.id,
            user_id: userId || null,
            temporary_id: null,
            starts_at: new Date(sub.current_period_start * 1000).toISOString(),
            ends_at: sub.cancel_at_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
            is_active: sub.status === 'active' || sub.status === 'trialing',
            payment_id: sub.id,
            customer_id: stripeCustomerId,
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end: sub.current_period_end,
            is_live_mode: sub.livemode
          };
          
          console.log("Formatted Stripe subscription data:", stripeSubscription);
        } else {
          console.log("No valid subscriptions found for customer:", stripeCustomerId);
        }
      } catch (err) {
        console.error("Error looking up Stripe subscriptions:", err);
        console.error("Error details:", err.message);
        console.error("Stack trace:", err.stack);
      }
    }

    // Decide which subscription to return
    let finalSubscription = null;

    if (stripeSubscription && dbSubscription) {
      // If we have both, prefer the Stripe one for most up-to-date status
      console.log("Using Stripe subscription data with database ID");
      finalSubscription = {
        ...stripeSubscription,
        id: dbSubscription.id  // Keep the database ID for consistency
      };
    } else if (stripeSubscription) {
      console.log("Using Stripe subscription data only");
      finalSubscription = stripeSubscription;
    } else if (dbSubscription) {
      console.log("Using database subscription data only");
      finalSubscription = dbSubscription;
    }

    // If detailed information isn't needed, just return status
    if (!includeDetails && finalSubscription) {
      return new Response(
        JSON.stringify({ 
          hasActiveSubscription: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Final response:", {
      subscription: finalSubscription,
      hasActiveSubscription: !!finalSubscription
    });

    return new Response(
      JSON.stringify({
        subscription: finalSubscription,
        hasActiveSubscription: !!finalSubscription
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error in verify-subscription:", err);
    console.error("Error details:", err.message);
    console.error("Stack trace:", err.stack);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: err.message,
        stack: err.stack
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
