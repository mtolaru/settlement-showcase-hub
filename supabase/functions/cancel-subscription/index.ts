
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    // Get request data
    const { subscriptionId } = await req.json();
    
    if (!subscriptionId) {
      throw new Error('Missing subscription ID');
    }

    // Get Stripe key from environment variables
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Missing Stripe API key');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user information from the request authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the JWT to get the user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authorization token');
    }

    // Get the subscription from the database
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (subscriptionError || !subscription) {
      throw new Error('Subscription not found or not authorized');
    }

    // Update subscription in Supabase to mark as inactive
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        is_active: false,
        ends_at: new Date().toISOString() // Set end date to now
      })
      .eq('id', subscriptionId);

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    // Hide all settlements that are not individually paid for
    const { error: settlementUpdateError } = await supabase
      .from('settlements')
      .update({
        hidden: true
      })
      .eq('user_id', user.id)
      .eq('payment_completed', false);

    if (settlementUpdateError) {
      console.error('Error hiding settlements:', settlementUpdateError);
    }

    // Try to cancel in Stripe if we have the payment ID
    // Note: This is a simplification - you may need to adjust based on your actual Stripe setup
    if (subscription.payment_id) {
      try {
        await stripe.subscriptions.cancel(subscription.payment_id);
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscription:', stripeError);
        // Continue anyway, as we've already updated our database
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Subscription cancelled successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
