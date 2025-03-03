
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";

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
    // Get the request body
    const requestData = await req.json();
    const { subscription_id, return_url } = requestData;

    console.log('Creating Stripe customer portal session for subscription:', subscription_id);
    console.log('Return URL:', return_url);

    if (!subscription_id) {
      console.error('Missing subscription_id in request');
      return new Response(
        JSON.stringify({ error: 'Missing subscription_id parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Stripe key from environment
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // First, retrieve the subscription to get the customer ID
    console.log('Retrieving Stripe subscription details...');
    let customerId;
    
    // Check if this is a direct customer ID or a subscription ID
    if (subscription_id.startsWith('cus_')) {
      console.log('Direct customer ID provided:', subscription_id);
      customerId = subscription_id;
    } else {
      try {
        // Try to retrieve subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscription_id);
        console.log('Subscription retrieved:', subscription.id);
        customerId = subscription.customer as string;
      } catch (error) {
        // If subscription retrieval fails, try using it directly as a customer ID
        console.log('Could not retrieve subscription, using ID directly as customer ID');
        customerId = subscription_id;
      }
    }

    if (!customerId) {
      console.error('No customer ID found for subscription:', subscription_id);
      return new Response(
        JSON.stringify({ error: 'No customer ID found for this subscription' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Creating portal session for customer:', customerId);
    
    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url || 'https://settlementdb.com/manage',
    });

    console.log('Portal session created successfully:', session.url);

    // Return the URL of the portal
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating Stripe portal session:', error);
    
    // Determine if this is a Stripe API error
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check if it's a Stripe error
      if ('type' in error && typeof error.type === 'string' && error.type.startsWith('Stripe')) {
        // Format Stripe-specific errors
        if ('code' in error) {
          errorMessage = `Stripe error (${error.code}): ${errorMessage}`;
        } else {
          errorMessage = `Stripe error: ${errorMessage}`;
        }
        
        // Use appropriate status code for client errors
        if (error.type.includes('InvalidRequest') || error.type.includes('CardError')) {
          statusCode = 400;
        } else if (error.type.includes('Authentication')) {
          statusCode = 401;
        }
      }
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
