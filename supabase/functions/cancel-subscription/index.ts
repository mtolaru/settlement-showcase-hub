// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from 'https://esm.sh/stripe@14.13.0';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get the authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get request body
    const { subscriptionId } = await req.json();
    
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }
    
    console.log('Received request to cancel subscription:', subscriptionId);

    // Initialize the Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User verification error:', userError);
      throw new Error('Unauthorized');
    }

    // Fetch the subscription from our database
    const { data: subscriptionData, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscriptionData) {
      console.error('Fetch subscription error:', fetchError);
      throw new Error('Subscription not found');
    }

    // Verify user owns the subscription
    if (subscriptionData.user_id !== user.id) {
      throw new Error('Unauthorized: User does not own this subscription');
    }
    
    // Check if the subscription is already cancelled (to avoid redundant API calls)
    if (subscriptionData.stripe_subscription_id) {
      console.log('Cancelling Stripe subscription:', subscriptionData.stripe_subscription_id);
      
      try {
        // Cancel the subscription in Stripe
        // Note: This keeps the subscription active until the end of the current period
        await stripe.subscriptions.update(subscriptionData.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
        
        console.log('Stripe subscription cancelled successfully');
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError);
        
        // Check if the subscription doesn't exist in Stripe (already cancelled)
        if (stripeError.code === 'resource_missing') {
          console.log('Subscription already cancelled or not found in Stripe');
        } else {
          throw stripeError;
        }
      }
    } else {
      console.log('No Stripe subscription ID found, skipping Stripe API call');
    }

    // Update our database to mark subscription as cancelled
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        is_active: false,
        ends_at: subscriptionData.ends_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Update subscription error:', updateError);
      throw updateError;
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription cancelled successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Error cancelling subscription'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
