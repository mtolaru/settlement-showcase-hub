
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
    const { 
      subscription_id, 
      stripe_subscription_id,
      return_url, 
      user_email 
    } = requestData;

    console.log('Creating Stripe customer portal session with data:', {
      subscription_id,
      stripe_subscription_id,
      return_url,
      user_email
    });

    if (!subscription_id && !stripe_subscription_id && !user_email) {
      console.error('Missing required parameters - need either subscription_id, stripe_subscription_id or user_email');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required identification parameters',
          details: 'Either subscription_id, stripe_subscription_id or user_email must be provided',
          status: 'error' 
        }),
        { 
          status: 200, // Return 200 instead of 400
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Stripe key from environment
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe configuration missing',
          status: 'error' 
        }),
        { 
          status: 200, // Return 200 instead of 500
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
    // 1. Try using stripe_subscription_id first if provided
    if (stripe_subscription_id) {
      try {
        console.log('Looking up customer via Stripe subscription ID:', stripe_subscription_id);
        const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id);
        console.log('Found subscription:', subscription.id);
        customerId = subscription.customer as string;
        console.log('Derived customer ID from subscription:', customerId);
      } catch (error) {
        console.log('Could not retrieve subscription with ID:', stripe_subscription_id, error);
      }
    }
    
    // 2. Check if subscription_id is a direct customer ID
    if (!customerId && subscription_id?.startsWith('cus_')) {
      console.log('Direct customer ID provided:', subscription_id);
      customerId = subscription_id;
    } 
    
    // 3. Try to retrieve subscription details from Stripe
    if (!customerId && subscription_id && !subscription_id.startsWith('cus_')) {
      try {
        console.log('Attempting to retrieve subscription with ID:', subscription_id);
        const subscription = await stripe.subscriptions.retrieve(subscription_id);
        console.log('Subscription retrieved:', subscription.id);
        customerId = subscription.customer as string;
        console.log('Derived customer ID from subscription:', customerId);
      } catch (error) {
        console.log('Could not retrieve subscription with ID:', subscription_id, error);
        
        // 4. Try using it directly as a customer ID even if it doesn't start with cus_
        try {
          console.log('Checking if the ID might be a customer ID anyway:', subscription_id);
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
    
    // 5. If user_email is provided, try to find customer by email
    if (!customerId && user_email) {
      console.log('Searching for customer by email:', user_email);
      
      try {
        // First try exact match
        const customers = await stripe.customers.list({
          email: user_email,
          limit: 1,
        });
        
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          console.log('Found customer by exact email match:', customerId);
        } else {
          console.log('No customer found with exact email match:', user_email);
          
          // Try searching with case-insensitive like match
          console.log('Attempting case-insensitive email search...');
          const allCustomers = await stripe.customers.list({ limit: 100 });
          
          // Log all retrieved emails for debugging
          console.log('All customer emails found:', 
            allCustomers.data.map(c => ({ id: c.id, email: c.email }))
          );
          
          // Try exact match but case-insensitive
          const matchingCustomer = allCustomers.data.find(
            c => c.email && c.email.toLowerCase() === user_email.toLowerCase()
          );
          
          if (matchingCustomer) {
            customerId = matchingCustomer.id;
            console.log('Found customer by case-insensitive email match:', customerId, 'with email:', matchingCustomer.email);
          } else {
            console.log('No customer found with case-insensitive email match either.');
            
            // Try partial email match as a last resort (for development/test emails)
            const emailBase = user_email.split('@')[0].split('+')[0]; // Get base email (before + if any)
            const domain = user_email.split('@')[1];
            
            console.log(`Trying partial match with base: ${emailBase} and domain: ${domain}`);
            
            // Find customers where email contains both the base part and domain
            const partialMatchCustomer = allCustomers.data.find(c => 
              c.email && 
              c.email.toLowerCase().includes(emailBase.toLowerCase()) && 
              c.email.toLowerCase().includes(domain.toLowerCase())
            );
            
            if (partialMatchCustomer) {
              customerId = partialMatchCustomer.id;
              console.log('Found customer by partial email match:', customerId, 'with email:', partialMatchCustomer.email);
            } else {
              // Try another approach - compare just the parts before the "+"
              const partialBaseMatchCustomer = allCustomers.data.find(c => {
                if (!c.email) return false;
                const customerEmailBase = c.email.split('@')[0].split('+')[0].toLowerCase();
                return customerEmailBase === emailBase.toLowerCase() && 
                       c.email.toLowerCase().includes(domain.toLowerCase());
              });
              
              if (partialBaseMatchCustomer) {
                customerId = partialBaseMatchCustomer.id;
                console.log('Found customer by email base match:', customerId, 'with email:', partialBaseMatchCustomer.email);
              }
            }
          }
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
          details: 'We could not find a Stripe customer record associated with your account.',
          debug_info: {
            subscription_id,
            stripe_subscription_id,
            user_email,
            timestamp: new Date().toISOString()
          },
          status: 'error',
          redirectUrl: return_url ? `${return_url}?error=no_customer` : undefined
        }),
        { 
          status: 200, // Return 200 instead of 404
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
      console.log('Customer verified:', customer.id, 'email:', customer.email);
    } catch (error) {
      console.error('Customer verification failed:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Customer verification failed',
          details: 'The Stripe customer record could not be found or has been deleted.',
          debug_info: {
            customer_id: customerId,
            error_message: error.message,
            timestamp: new Date().toISOString()
          },
          status: 'error',
          redirectUrl: return_url ? `${return_url}?error=customer_verification` : undefined
        }),
        { 
          status: 200, // Return 200 instead of 404
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Creating portal session for verified customer:', customerId);
    
    // Create a billing portal session
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: return_url || 'https://settlementdb.com/manage',
      });

      console.log('Portal session created successfully:', session.url);

      // Return the URL of the portal
      return new Response(
        JSON.stringify({ 
          url: session.url,
          status: 'success' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (portalError) {
      console.error('Error creating Stripe portal session:', portalError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create Stripe portal session',
          details: portalError.message,
          status: 'error',
          redirectUrl: return_url ? `${return_url}?error=portal&message=${encodeURIComponent(portalError.message)}` : undefined
        }),
        { 
          status: 200, // Return 200 instead of 400
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error creating Stripe portal session:', error);
    
    // Determine if this is a Stripe API error
    let errorMessage = 'Internal server error';
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        timestamp: new Date().toISOString()
      };
      
      // Check if it's a Stripe error
      if ('type' in error && typeof error.type === 'string' && error.type.startsWith('Stripe')) {
        // Format Stripe-specific errors
        errorDetails = {
          ...errorDetails,
          type: error.type,
          code: 'code' in error ? error.code : undefined,
          param: 'param' in error ? error.param : undefined,
        };
        
        if ('code' in error) {
          errorMessage = `Stripe error (${error.code}): ${errorMessage}`;
        } else {
          errorMessage = `Stripe error: ${errorMessage}`;
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        status: 'error'
      }),
      { 
        status: 200, // Return 200 instead of 500
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
