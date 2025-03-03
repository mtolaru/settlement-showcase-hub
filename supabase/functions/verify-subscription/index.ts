
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";
import Stripe from "https://esm.sh/stripe@13.2.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types for our subscription data
interface Subscription {
  id: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  payment_id: string | null; 
  customer_id: string | null;
  temporary_id: string | null;
  user_id: string | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

    // Create Supabase client with service role key (admin access)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Get user data from the request
    const { userId, email } = await req.json();
    
    if (!userId && !email) {
      return new Response(
        JSON.stringify({ error: "userId or email is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verifying subscription for user ID: ${userId}, email: ${email}`);

    // First, check for a subscription in our database
    let subscription: Subscription | null = null;

    if (userId) {
      const { data: dbSubscriptions, error: dbError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('starts_at', { ascending: false })
        .limit(1);

      if (dbError) {
        console.error('Database query error:', dbError);
        throw dbError;
      }

      if (dbSubscriptions && dbSubscriptions.length > 0) {
        subscription = dbSubscriptions[0] as Subscription;
        console.log(`Found subscription in database:`, subscription);
      }
    }

    // Check if we have a valid subscription already
    let verified = false;
    
    // If we have a subscription with a customer_id, verify it with Stripe
    if (subscription?.customer_id) {
      try {
        console.log(`Verifying subscription with Stripe customer ID: ${subscription.customer_id}`);
        
        // Retrieve all active Stripe subscriptions for the customer
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: subscription.customer_id,
          status: 'active',
          limit: 1,
        });

        if (stripeSubscriptions.data.length > 0) {
          console.log("Found active Stripe subscription");
          verified = true;
          
          // Update the subscription data from Stripe if necessary
          const stripeSub = stripeSubscriptions.data[0];
          
          // Only update if there are differences
          if (stripeSub.id !== subscription.payment_id || 
              new Date(stripeSub.current_period_end * 1000).toISOString() !== subscription.ends_at) {
            
            console.log("Updating subscription information from Stripe");
            
            // Update our subscription record with the latest Stripe data
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                payment_id: stripeSub.id,
                starts_at: new Date(stripeSub.current_period_start * 1000).toISOString(),
                ends_at: new Date(stripeSub.current_period_end * 1000).toISOString()
              })
              .eq('id', subscription.id);
            
            if (updateError) {
              console.error('Error updating subscription:', updateError);
            } else {
              // Update local subscription object with new data
              subscription.payment_id = stripeSub.id;
              subscription.starts_at = new Date(stripeSub.current_period_start * 1000).toISOString();
              subscription.ends_at = new Date(stripeSub.current_period_end * 1000).toISOString();
            }
          }
        } else {
          console.log("No active Stripe subscription found for customer");
          
          // If the subscription is marked as active but Stripe says it's not, update our database
          if (subscription.is_active) {
            console.log("Updating subscription to inactive");
            
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                is_active: false,
                ends_at: new Date().toISOString()
              })
              .eq('id', subscription.id);
            
            if (updateError) {
              console.error('Error updating subscription status:', updateError);
            } else {
              // Update local subscription object
              subscription.is_active = false;
              subscription.ends_at = new Date().toISOString();
            }
          }
        }
      } catch (stripeError) {
        console.error('Stripe verification error:', stripeError);
        // Don't throw, just log the error and continue
      }
    }

    // If we don't have a subscription from the database or it's not verified with Stripe,
    // check if we can find a Stripe subscription by email
    if ((!subscription || !verified) && email) {
      try {
        console.log(`Searching for Stripe customer by email: ${email}`);
        
        // Find Stripe customer by email
        const customers = await stripe.customers.list({
          email: email,
          limit: 1,
        });

        if (customers.data.length > 0) {
          const customer = customers.data[0];
          console.log(`Found Stripe customer: ${customer.id}`);
          
          // Check for active subscriptions
          const stripeSubscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
            limit: 1,
          });

          if (stripeSubscriptions.data.length > 0) {
            const stripeSub = stripeSubscriptions.data[0];
            console.log(`Found active Stripe subscription: ${stripeSub.id}`);
            
            // Check if we already have this subscription in our database by customer_id
            const { data: existingSubs, error: existingError } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('customer_id', customer.id)
              .limit(1);
            
            if (existingError) {
              console.error('Error checking for existing subscription:', existingError);
            }
            
            // If we already have it, update it
            if (existingSubs && existingSubs.length > 0) {
              const existingSub = existingSubs[0];
              console.log(`Updating existing subscription in database: ${existingSub.id}`);
              
              const { error: updateError } = await supabase
                .from('subscriptions')
                .update({
                  user_id: userId || existingSub.user_id,
                  payment_id: stripeSub.id,
                  starts_at: new Date(stripeSub.current_period_start * 1000).toISOString(),
                  ends_at: new Date(stripeSub.current_period_end * 1000).toISOString(),
                  is_active: true
                })
                .eq('id', existingSub.id);
              
              if (updateError) {
                console.error('Error updating subscription:', updateError);
              } else {
                subscription = {
                  ...existingSub,
                  user_id: userId || existingSub.user_id,
                  payment_id: stripeSub.id,
                  starts_at: new Date(stripeSub.current_period_start * 1000).toISOString(),
                  ends_at: new Date(stripeSub.current_period_end * 1000).toISOString(),
                  is_active: true
                };
                verified = true;
              }
            } else {
              // Create a new subscription record
              console.log(`Creating new subscription record for Stripe subscription: ${stripeSub.id}`);
              
              const { data: newSub, error: insertError } = await supabase
                .from('subscriptions')
                .insert({
                  user_id: userId,
                  customer_id: customer.id,
                  payment_id: stripeSub.id,
                  starts_at: new Date(stripeSub.current_period_start * 1000).toISOString(),
                  ends_at: new Date(stripeSub.current_period_end * 1000).toISOString(),
                  is_active: true
                })
                .select()
                .single();
              
              if (insertError) {
                console.error('Error creating subscription:', insertError);
              } else {
                subscription = newSub as Subscription;
                verified = true;
              }
            }
          }
        }
      } catch (stripeError) {
        console.error('Error looking up customer in Stripe:', stripeError);
        // Don't throw, just log the error and continue
      }
    }

    // If we still don't have a verified subscription, check if the user has paid settlements
    // and create a virtual subscription if they have
    if ((!subscription || !verified) && userId) {
      try {
        console.log(`Checking for paid settlements for user: ${userId}`);
        
        // Check if the user has any paid settlements
        const { data: paidSettlements, error: settlementsError } = await supabase
          .from('settlements')
          .select('*')
          .eq('user_id', userId)
          .eq('payment_completed', true)
          .limit(1);
        
        if (settlementsError) {
          console.error('Error checking for paid settlements:', settlementsError);
        } else if (paidSettlements && paidSettlements.length > 0) {
          console.log(`User has paid settlements, creating a virtual subscription`);
          
          // Create a "virtual" subscription based on paid settlements
          const startDate = new Date();
          
          // Set an end date 1 year from now for the virtual subscription
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1);
          
          // Check if we already have a virtual subscription
          const { data: virtualSubs, error: virtualError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .is('customer_id', null)
            .is('payment_id', null)
            .limit(1);
          
          if (virtualError) {
            console.error('Error checking for virtual subscription:', virtualError);
          } else if (virtualSubs && virtualSubs.length > 0) {
            // Update the existing virtual subscription
            const virtualSub = virtualSubs[0];
            console.log(`Updating existing virtual subscription: ${virtualSub.id}`);
            
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                is_active: true,
                ends_at: endDate.toISOString()
              })
              .eq('id', virtualSub.id);
            
            if (updateError) {
              console.error('Error updating virtual subscription:', updateError);
            } else {
              subscription = {
                ...virtualSub,
                is_active: true,
                ends_at: endDate.toISOString()
              };
            }
          } else {
            // Create a new virtual subscription
            console.log(`Creating new virtual subscription`);
            
            const { data: newSub, error: insertError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: userId,
                starts_at: startDate.toISOString(),
                ends_at: endDate.toISOString(),
                is_active: true
              })
              .select()
              .single();
            
            if (insertError) {
              console.error('Error creating virtual subscription:', insertError);
            } else {
              subscription = newSub as Subscription;
            }
          }
        }
      } catch (error) {
        console.error('Error checking for paid settlements:', error);
      }
    }

    return new Response(
      JSON.stringify({
        subscription,
        verified,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-subscription function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
