
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.20.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { subscriptionId } = await req.json();
    console.log('Cancellation request received for subscription:', subscriptionId);

    if (!subscriptionId) {
      console.error('No subscription ID provided');
      return new Response(
        JSON.stringify({ error: 'No subscription ID provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Fetch the subscription from the database
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError) {
      console.error('Error fetching subscription:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Error fetching subscription', details: fetchError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    console.log('Found subscription in DB:', subscription);

    // Determine the subscription type
    const isStripeSubscription = subscription.customer_id || (subscription.id.startsWith('stripe-') && subscription.id.substring(7));
    const isVirtualSubscription = subscription.id.startsWith('virtual-');
    
    console.log('Subscription type check:', { 
      isStripeSubscription, 
      isVirtualSubscription, 
      customerId: subscription.customer_id,
      subscriptionId: subscription.id 
    });

    // For Stripe-based subscriptions, create a customer portal session
    if (isStripeSubscription) {
      // Extract the customer ID - either from the subscription or from the ID itself
      const customerId = subscription.customer_id || (subscription.id.startsWith('stripe-') ? subscription.id.substring(7) : null);
      
      if (!customerId) {
        console.error('No customer ID found for subscription:', subscription.id);
        return new Response(
          JSON.stringify({ error: 'No customer ID found for this subscription' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      console.log('Creating portal session for customer ID:', customerId);
      
      try {
        // Create a Stripe Customer Portal session
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${req.headers.get('origin')}/manage`,
        });
        
        console.log('Created portal session:', session.url);
        
        // Return the URL to redirect the user to
        return new Response(
          JSON.stringify({ redirectUrl: session.url }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      } catch (stripeError) {
        console.error('Stripe error creating portal session:', stripeError);
        return new Response(
          JSON.stringify({ 
            error: 'Error creating Stripe portal session', 
            details: stripeError.message,
            code: 'stripe_error' 
          }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }
    
    // For virtual subscriptions, handle cancellation in the database directly
    if (isVirtualSubscription) {
      console.log('Handling virtual subscription cancellation for:', subscription.id);
      
      const now = new Date();
      const endsAt = now.toISOString();
      
      // Update the subscription in the database to mark it as canceled
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          ends_at: endsAt,
          is_active: false
        })
        .eq('id', subscription.id);
      
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return new Response(
          JSON.stringify({ error: 'Error updating subscription', details: updateError.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      console.log('Virtual subscription canceled successfully');
      
      // Return a success response for virtual subscriptions
      return new Response(
        JSON.stringify({ 
          success: true, 
          canceled_immediately: true,
          active_until: endsAt 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // If we get here, we don't know how to handle this subscription type
    console.error('Unknown subscription type:', subscription.id);
    return new Response(
      JSON.stringify({ error: 'Unknown subscription type' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Unhandled error in cancel-subscription function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
