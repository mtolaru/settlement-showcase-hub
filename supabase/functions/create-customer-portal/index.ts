
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

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

if (!supabaseUrl || !supabaseKey || !stripeSecretKey) {
  console.error('Missing required environment variables');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    console.log('Processing customer portal request');
    
    // Parse request body
    const requestData = await req.json().catch(e => {
      console.error('Error parsing request JSON:', e);
      throw new Error('Invalid JSON in request body');
    });
    
    const { subscription_id, return_url } = requestData;
    console.log(`Processing portal request for subscription: ${subscription_id}`);

    if (!subscription_id) {
      console.error('Missing subscription_id in request');
      return new Response(
        JSON.stringify({ error: 'Subscription ID is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    if (!return_url) {
      console.warn('No return_url provided, using default');
    }

    // Get the subscription from the database
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .single();

    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      return new Response(
        JSON.stringify({ error: 'Subscription not found', details: subscriptionError }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    if (!subscriptionData) {
      console.error('No subscription data found for ID:', subscription_id);
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Get customer_id - could be directly in subscription record 
    // or we need to look it up in Stripe
    let customerId = subscriptionData.customer_id;
    console.log('Initial customer ID from subscription:', customerId);
    
    // If no customer_id is found in our database, we'll need to look it up
    if (!customerId && subscriptionData.user_id) {
      console.log('No customer_id found, looking up by user_id:', subscriptionData.user_id);
      
      // Look up the user's email from auth.users
      const { data: userData, error: userError } = await supabase
        .auth
        .admin
        .getUserById(subscriptionData.user_id);

      if (userError) {
        console.error('Error fetching user:', userError);
        return new Response(
          JSON.stringify({ error: 'User not found', details: userError }),
          { 
            status: 404, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }

      if (!userData?.user?.email) {
        console.error('No email found for user:', subscriptionData.user_id);
        return new Response(
          JSON.stringify({ error: 'User email not found' }),
          { 
            status: 404, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }

      console.log('Looking up Stripe customer by email:', userData.user.email);
      
      // Look up customer in Stripe by email
      try {
        const customers = await stripe.customers.list({
          email: userData.user.email,
          limit: 1,
        });

        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          console.log('Found Stripe customer by email:', customerId);
          
          // Update our subscription record with the customer_id for future use
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ customer_id: customerId })
            .eq('id', subscription_id);
            
          if (updateError) {
            console.warn('Could not update subscription with customer_id:', updateError);
            // Continue anyway since we found the customer ID
          }
        } else {
          console.error('No Stripe customer found for email:', userData.user.email);
          return new Response(
            JSON.stringify({ error: 'No Stripe customer found for this user' }),
            { 
              status: 404, 
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders 
              } 
            }
          );
        }
      } catch (stripeError) {
        console.error('Stripe API error:', stripeError);
        return new Response(
          JSON.stringify({ error: 'Error looking up Stripe customer', details: stripeError.message }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }
    }

    if (!customerId) {
      console.error('Customer ID not found through any method');
      return new Response(
        JSON.stringify({ error: 'Customer ID not found' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    console.log('Creating Stripe portal session for customer:', customerId);
    
    // Create a Stripe customer portal session
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: return_url || `${Deno.env.get('FRONTEND_URL') || 'https://localhost:5173'}/manage`,
      });

      console.log('Created portal session:', session.url);

      // Return the URL to the portal with success status
      return new Response(
        JSON.stringify({ url: session.url }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    } catch (stripeError) {
      console.error('Stripe portal session creation error:', stripeError);
      return new Response(
        JSON.stringify({ 
          error: 'Error creating Stripe portal session', 
          details: stripeError.message 
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
  } catch (error) {
    console.error('Uncaught error in Edge Function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});
