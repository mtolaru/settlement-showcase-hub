
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16', // Use the latest API version
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscriptionId } = await req.json();
    console.log('Received cancellation request for subscription:', subscriptionId);

    // Validate input
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    // Check if this is a virtual subscription (handled locally)
    if (subscriptionId.startsWith('virtual-') || subscriptionId.startsWith('stripe-')) {
      console.log('Virtual subscription detected, handled on client side');
      return new Response(
        JSON.stringify({ 
          message: 'Virtual subscription cancellation is handled on the client side',
          canceled_immediately: false,
          active_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Get subscription details from Supabase
    const { data: subscriptionData, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching subscription from database:', fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!subscriptionData) {
      console.error('Subscription not found:', subscriptionId);
      throw new Error('Subscription not found');
    }

    console.log('Found subscription in database:', subscriptionData);

    // If this is a Stripe subscription, handle through Stripe
    if (subscriptionData.customer_id && subscriptionData.payment_id) {
      console.log('Processing Stripe subscription cancellation');
      
      try {
        // For Stripe subscriptions, create a customer portal session
        // This allows the user to manage their subscription directly in Stripe
        const session = await stripe.billingPortal.sessions.create({
          customer: subscriptionData.customer_id,
          return_url: `${req.headers.get('origin') || ''}/manage`,
        });

        console.log('Created Stripe Portal session:', session.url);
        
        // Return the URL for the portal session
        return new Response(
          JSON.stringify({ redirectUrl: session.url }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      } catch (stripeError) {
        console.error('Stripe portal session creation error:', stripeError);
        
        // If we can't create a portal session, try to cancel the subscription directly
        try {
          // If we know the Stripe subscription ID, we can try to cancel it directly
          if (subscriptionData.payment_id && subscriptionData.payment_id.startsWith('sub_')) {
            await stripe.subscriptions.update(subscriptionData.payment_id, {
              cancel_at_period_end: true
            });
            
            console.log('Updated Stripe subscription to cancel at period end');
            
            // Update subscription in database
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              })
              .eq('id', subscriptionId);
              
            if (updateError) {
              console.error('Error updating subscription in database:', updateError);
              throw updateError;
            }
            
            return new Response(
              JSON.stringify({ 
                message: 'Subscription canceled successfully',
                canceled_immediately: false,
                active_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              }
            );
          }
        } catch (directCancelError) {
          console.error('Error canceling subscription directly:', directCancelError);
          throw new Error(`Stripe error: ${directCancelError.message || 'Failed to cancel subscription'}`);
        }
        
        throw new Error(`Stripe error: ${stripeError.message || 'Failed to create portal session'}`);
      }
    }
    
    // For database-only subscriptions (without Stripe)
    console.log('Processing database-only subscription cancellation');
    
    // Update the subscription in the database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        is_active: false,
        ends_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);
      
    if (updateError) {
      console.error('Error updating subscription in database:', updateError);
      throw new Error(`Database error: ${updateError.message}`);
    }
    
    console.log('Subscription successfully canceled in database');
    
    return new Response(
      JSON.stringify({ 
        message: 'Subscription canceled successfully',
        canceled_immediately: true
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to cancel subscription'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});
