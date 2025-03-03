
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@13.1.0?dts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use the actual environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { subscription_id, return_url } = await req.json();
    console.log(`Processing portal request for subscription: ${subscription_id}`);

    if (!subscription_id) {
      throw new Error('Subscription ID is required');
    }

    // Get the subscription from the database
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .single();

    if (subscriptionError || !subscriptionData) {
      console.error('Error fetching subscription:', subscriptionError);
      throw new Error('Subscription not found');
    }

    // Get customer_id - could be directly in subscription record 
    // or we need to look it up in Stripe
    let customerId = subscriptionData.customer_id;
    
    // If no customer_id is found in our database, we'll need to look it up
    if (!customerId && subscriptionData.user_id) {
      // Look up the user's email from auth.users
      const { data: userData, error: userError } = await supabase
        .auth
        .admin
        .getUserById(subscriptionData.user_id);

      if (userError || !userData?.user?.email) {
        console.error('Error fetching user:', userError);
        throw new Error('User not found');
      }

      // Look up customer in Stripe by email
      const customers = await stripe.customers.list({
        email: userData.user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        
        // Update our subscription record with the customer_id for future use
        await supabase
          .from('subscriptions')
          .update({ customer_id: customerId })
          .eq('id', subscription_id);
      } else {
        throw new Error('No Stripe customer found for this user');
      }
    }

    if (!customerId) {
      throw new Error('Customer ID not found');
    }

    // Create a Stripe customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url,
    });

    console.log('Created portal session:', session.url);

    // Return the URL to the portal
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});
