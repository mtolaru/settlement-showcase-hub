
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
    const { subscription_id, return_url, user_email } = requestData;

    console.log('Creating Stripe customer portal session with data:', {
      subscription_id,
      return_url,
      user_email
    });

    if (!subscription_id && !user_email) {
      console.error('Missing required parameters - need either subscription_id or user_email');
      return new Response(
        JSON.stringify({ error: 'Missing subscription_id or user_email parameter' }),
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

    // First, try to find customer
    console.log('Attempting to identify Stripe customer...');
    let customerId;
    
    // Try several approaches to find the customer ID
    // 1. Check if subscription_id is a direct customer ID
    if (subscription_id?.startsWith('cus_')) {
      console.log('Direct customer ID provided:', subscription_id);
      customerId = subscription_id;
    } 
    // 2. Try to retrieve subscription details from Stripe
    else if (subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscription_id);
        console.log('Subscription retrieved:', subscription.id);
        customerId = subscription.customer as string;
      } catch (error) {
        console.log('Could not retrieve subscription with ID:', subscription_id, error);
        
        // 3. Try using it directly as a customer ID even if it doesn't start with cus_
        try {
          const customer = await stripe.customers.retrieve(subscription_id);
          if (customer && !customer.deleted) {
            console.log('Successfully retrieved customer using ID:', subscription_id);
            customerId = subscription_id;
          }
        } catch (customerError) {
          console.log('Not a valid customer ID either:', subscription_id);
        }
      }
    }
    
    // 4. If user_email is provided, try to find customer by email
    if (!customerId && user_email) {
      console.log('Searching for customer by email:', user_email);
      try {
        const customers = await stripe.customers.list({
          email: user_email,
          limit: 1,
        });
        
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          console.log('Found customer by email:', customerId);
        } else {
          console.log('No customer found with email:', user_email);
        }
      } catch (emailLookupError) {
        console.error('Error looking up customer by email:', emailLookupError);
      }
    }

    if (!customerId) {
      console.error('Could not identify a valid Stripe customer with the provided information');
      return new Response(
        JSON.stringify({ 
          error: 'No valid Stripe customer found',
          details: 'We could not find a Stripe customer record associated with your account.'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the customer actually exists in Stripe
    try {
      console.log('Verifying customer exists:', customerId);
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }
    } catch (error) {
      console.error('Customer verification failed:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Customer verification failed',
          details: 'The Stripe customer record could not be found or has been deleted.'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Creating portal session for verified customer:', customerId);
    
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
