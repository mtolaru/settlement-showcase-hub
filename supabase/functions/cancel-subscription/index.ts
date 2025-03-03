
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Log the request
    console.log('Received cancel subscription request');
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', JSON.stringify(requestBody));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const { subscriptionId } = requestBody;
    if (!subscriptionId) {
      console.error('Missing subscriptionId in request');
      return new Response(
        JSON.stringify({ error: 'Missing subscriptionId in request' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('Canceling subscription:', subscriptionId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the subscription details from our database
    console.log('Fetching subscription details from database');
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      return new Response(
        JSON.stringify({ 
          error: 'Subscription not found',
          details: subscriptionError 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    if (!subscriptionData) {
      console.error('Subscription not found:', subscriptionId);
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    console.log('Found subscription data:', JSON.stringify(subscriptionData));

    // Check if this is a "virtual" subscription
    const isVirtualSubscription = 
      subscriptionId.startsWith('virtual-') || 
      subscriptionId.startsWith('stripe-') ||
      (!subscriptionData.payment_id && !subscriptionData.customer_id);

    console.log('Subscription type:', isVirtualSubscription ? 'Virtual' : 'Stripe');

    if (isVirtualSubscription) {
      // For virtual subscriptions, we just update our database
      console.log('Handling virtual subscription cancellation');
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + 30); // Give them 30 more days
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ 
          is_active: true,  // Still active until end date
          ends_at: endDate.toISOString() 
        })
        .eq('id', subscriptionId);
        
      if (error) {
        console.error('Error updating virtual subscription:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to cancel subscription', details: error }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
      
      console.log('Successfully updated virtual subscription end date');
      return new Response(
        JSON.stringify({
          id: subscriptionId,
          canceled_immediately: false,
          active_until: endDate.toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } else {
      // For Stripe subscriptions, we need to interact with Stripe
      // Initialize Stripe client
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
      
      if (!stripeSecretKey) {
        console.error('Missing Stripe secret key');
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
      
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
      
      console.log('Stripe initialized');
      
      // We need either customer_id or payment_id to create a portal session
      let customerId = subscriptionData.customer_id || null;
      
      // If we don't have a customer ID but have a payment ID, try to find the customer from Stripe
      if (!customerId && subscriptionData.payment_id) {
        try {
          console.log('Trying to retrieve customer from payment ID:', subscriptionData.payment_id);
          
          // First, try to interpret payment_id as a PaymentIntent ID
          try {
            console.log('Attempting to retrieve payment intent:', subscriptionData.payment_id);
            const paymentIntent = await stripe.paymentIntents.retrieve(subscriptionData.payment_id);
            if (paymentIntent && paymentIntent.customer) {
              customerId = paymentIntent.customer as string;
              console.log('Found customer ID from payment intent:', customerId);
            }
          } catch (e) {
            console.log('Not a payment intent ID or error retrieving:', e.message);
          }
          
          // If we still don't have a customer ID, try as a Subscription ID
          if (!customerId) {
            try {
              console.log('Attempting to retrieve subscription:', subscriptionData.payment_id);
              const subscription = await stripe.subscriptions.retrieve(subscriptionData.payment_id);
              if (subscription && subscription.customer) {
                customerId = subscription.customer as string;
                console.log('Found customer ID from subscription:', customerId);
              }
            } catch (e) {
              console.log('Not a subscription ID or error retrieving:', e.message);
            }
          }
          
          // If we found a customer ID, update it in our database for future use
          if (customerId) {
            console.log('Updating subscription with found customer ID:', customerId);
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({ customer_id: customerId })
              .eq('id', subscriptionId);
              
            if (updateError) {
              console.error('Error updating customer ID:', updateError);
            } else {
              console.log('Updated subscription with customer ID');
            }
          }
        } catch (lookupError) {
          console.error('Error looking up customer from payment ID:', lookupError);
        }
      }
      
      if (!customerId && !subscriptionData.payment_id) {
        console.error('No customer ID or payment ID found for subscription');
        
        // Still try to handle it gracefully by falling back to database update
        console.log('Falling back to database update for subscription without customer ID');
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + 30); // Give them 30 more days
        
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            is_active: true,  // Still active until end date
            ends_at: endDate.toISOString() 
          })
          .eq('id', subscriptionId);
          
        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to cancel subscription', details: updateError }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }
        
        return new Response(
          JSON.stringify({
            id: subscriptionId,
            canceled_immediately: false,
            active_until: endDate.toISOString(),
            warning: 'No customer ID found, updated database only'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
      
      try {
        // Always fall back to payment_id if we couldn't find a customer ID
        const customerIdToUse = customerId || subscriptionData.payment_id;
        
        console.log('Creating Stripe portal session with customer ID:', customerIdToUse);
        
        // Create a customer portal session for cancellation
        const returnUrl = `${req.headers.get('origin') || 'https://settlementwins.com'}/manage`;
        console.log('Return URL for portal session:', returnUrl);
        
        const session = await stripe.billingPortal.sessions.create({
          customer: customerIdToUse,
          return_url: returnUrl,
        });
        
        console.log('Created Stripe portal session:', session.url);
        
        // Return the session URL so the frontend can redirect to it
        return new Response(
          JSON.stringify({ 
            redirectUrl: session.url 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      } catch (stripeError) {
        console.error('Stripe error creating portal session:', stripeError);
        
        // If we can't create a portal session, fall back to our database update
        console.log('Falling back to database-only cancellation due to Stripe error');
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + 30); // Give them 30 more days
        
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            is_active: true,  // Still active until end date
            ends_at: endDate.toISOString() 
          })
          .eq('id', subscriptionId);
          
        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to cancel subscription', details: updateError }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }
        
        return new Response(
          JSON.stringify({
            id: subscriptionId,
            canceled_immediately: false,
            active_until: endDate.toISOString(),
            error: 'Could not create Stripe portal session, but updated subscription end date in database'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
    }
  } catch (error) {
    console.error('Unhandled error in cancel-subscription function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
