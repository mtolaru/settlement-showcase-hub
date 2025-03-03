
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.0.0?dts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') as string;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Parse request body
    const { userId, email, includeDetails } = await req.json();
    console.log(`Verifying subscription for userId: ${userId}, email: ${email}, includeDetails: ${includeDetails}`);

    if (!userId && !email) {
      throw new Error('User ID or email is required');
    }

    // Check if there's an existing subscription in the database
    const { data: dbSubscriptions, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .or(`user_id.eq.${userId},temporary_id.eq.${userId}`)
      .eq('is_active', true)
      .order('starts_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching subscriptions from DB:', dbError);
    }

    if (dbSubscriptions && dbSubscriptions.length > 0) {
      console.log('Found subscription in database:', dbSubscriptions[0]);
      
      const dbSubscription = dbSubscriptions[0];
      
      // Check if this is a Stripe subscription and we need to fetch more details
      if (includeDetails && dbSubscription.stripe_subscription_id) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            dbSubscription.stripe_subscription_id
          );
          
          console.log('Retrieved Stripe subscription details:', stripeSubscription.status);
          
          // Enhance the DB subscription with Stripe details
          dbSubscription.status = stripeSubscription.status;
          dbSubscription.cancel_at_period_end = stripeSubscription.cancel_at_period_end;
          
          // If canceled, make sure ends_at is set
          if (stripeSubscription.cancel_at_period_end && stripeSubscription.current_period_end) {
            dbSubscription.ends_at = new Date(stripeSubscription.current_period_end * 1000).toISOString();
          }
        } catch (stripeError) {
          console.error('Error retrieving Stripe subscription details:', stripeError);
        }
      }
      
      return new Response(
        JSON.stringify({ subscription: dbSubscription }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no subscription in DB, check in Stripe
    if (email) {
      console.log('Searching for Stripe customer by email:', email);
      
      // Search for customers with matching email
      const customers = await stripe.customers.list({ email });
      
      if (customers.data.length > 0) {
        console.log(`Found ${customers.data.length} customers with email ${email}`);
        
        // Check each customer for active subscriptions
        for (const customer of customers.data) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'all'
          });
          
          if (subscriptions.data.length > 0) {
            console.log(`Found ${subscriptions.data.length} subscriptions for customer ${customer.id}`);
            
            // Find active subscriptions (active, trialing, or past_due)
            const activeSubscriptions = subscriptions.data.filter(sub => 
              ['active', 'trialing', 'past_due'].includes(sub.status) || 
              (sub.status === 'canceled' && sub.current_period_end * 1000 > Date.now())
            );
            
            if (activeSubscriptions.length > 0) {
              console.log('Found active subscription:', activeSubscriptions[0].id);
              
              const stripeSubscription = activeSubscriptions[0];
              
              // Create a virtual subscription from Stripe data
              const virtualSubscription = {
                id: `stripe-${stripeSubscription.id}`,
                starts_at: new Date(stripeSubscription.start_date * 1000).toISOString(),
                ends_at: stripeSubscription.cancel_at_period_end ? 
                  new Date(stripeSubscription.current_period_end * 1000).toISOString() : null,
                is_active: true,
                payment_id: stripeSubscription.id,
                customer_id: customer.id,
                temporary_id: null,
                user_id: userId,
                stripe_customer_id: customer.id,
                stripe_subscription_id: stripeSubscription.id,
                status: stripeSubscription.status,
                cancel_at_period_end: stripeSubscription.cancel_at_period_end
              };
              
              console.log('Created virtual subscription:', virtualSubscription);
              
              return new Response(
                JSON.stringify({ subscription: virtualSubscription }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      }
    }

    // No subscription found
    console.log('No active subscription found for user');
    return new Response(
      JSON.stringify({ subscription: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in verify-subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
