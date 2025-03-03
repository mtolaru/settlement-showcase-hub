
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from 'https://esm.sh/stripe@12.4.0?target=deno';

// Supabase client setup
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Stripe setup
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { subscriptionId } = await req.json();
    console.log(`Received request to cancel subscription: ${subscriptionId}`);

    // Check if this is a virtual subscription (starts with 'virtual-')
    if (subscriptionId.startsWith('virtual-')) {
      console.log('Handling virtual subscription cancellation');
      const userId = subscriptionId.replace('virtual-', '');
      
      // For virtual subscriptions, set end date to now
      const endDate = new Date();
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ 
          is_active: false,
          ends_at: endDate.toISOString()
        })
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error updating virtual subscription:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to cancel virtual subscription' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ 
          message: 'Virtual subscription canceled',
          canceled_immediately: true,
          active_until: endDate.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check if this is a Stripe customer ID (starts with 'stripe-')
    if (subscriptionId.startsWith('stripe-')) {
      console.log('Handling direct Stripe customer redirection');
      const customerId = subscriptionId.replace('stripe-', '');
      
      // Create Stripe customer portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${new URL(req.url).origin}/manage`,
      });

      console.log('Created Stripe portal session:', session.url);
      
      return new Response(
        JSON.stringify({ 
          redirectUrl: session.url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Handle regular subscription cancellation (if it's a UUID format subscription ID)
    // First check if it exists in our database
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      console.error('Error fetching subscription:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Found subscription:', subscription);

    // If there's a Stripe customer ID, redirect to Stripe portal
    if (subscription.customer_id) {
      console.log('Redirecting to Stripe portal for customer:', subscription.customer_id);
      
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.customer_id,
        return_url: `${new URL(req.url).origin}/manage`,
      });

      console.log('Created Stripe portal session:', session.url);
      
      return new Response(
        JSON.stringify({ 
          redirectUrl: session.url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // For database-only subscriptions without Stripe info
    // Set end date to current date (immediate cancellation)
    const endDate = new Date();
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        is_active: false,
        ends_at: endDate.toISOString() 
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to cancel subscription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Subscription canceled',
        canceled_immediately: true,
        active_until: endDate.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in cancel-subscription function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
