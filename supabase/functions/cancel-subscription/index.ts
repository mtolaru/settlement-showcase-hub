
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type RequestParams = {
  subscriptionId: string;
  action?: 'get_portal_url' | 'cancel';
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
    
    // Initialize Stripe and Supabase clients
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: '2022-11-15',
    })
    
    // Create admin Supabase client for accessing restricted tables
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    // Get request body
    const { subscriptionId, action = 'get_portal_url' } = await req.json() as RequestParams
    
    // Get current user ID from the token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Create a Supabase client that works with the user's token
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )
    
    // Get user data from the token
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid user token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log(`Processing subscription cancel request for user ${user.id}, subscription ${subscriptionId}`)
    
    // Fetch subscription details to verify ownership
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single()
    
    if (subscriptionError || !subscription) {
      console.error('Subscription not found or access denied:', subscriptionError)
      return new Response(JSON.stringify({ 
        error: 'Subscription not found or you do not have permission to cancel it' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Look up the Stripe customer ID
    const { data: stripeCustomers, error: customerError } = await supabaseAdmin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()
    
    if (customerError || !stripeCustomers) {
      console.error('Stripe customer not found:', customerError)
      return new Response(JSON.stringify({ 
        error: 'Stripe customer record not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const customerId = stripeCustomers.stripe_customer_id
    
    if (action === 'get_portal_url') {
      console.log(`Creating Stripe portal session for customer: ${customerId}`)
      
      // Create a Stripe customer portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.get('origin')}/manage`, // Return to manage page after cancellation
      })
      
      return new Response(JSON.stringify({ 
        success: true, 
        url: session.url 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else if (action === 'cancel') {
      // Direct cancellation via API (reserved for future use)
      // We'll primarily use the customer portal flow instead
      
      console.log(`Cancelling subscription via API: ${subscriptionId}`)
      
      // Look up the Stripe subscription ID
      const { data: stripeSubscriptions, error: subLookupError } = await supabaseAdmin
        .from('stripe_subscriptions')
        .select('stripe_subscription_id')
        .eq('subscription_id', subscriptionId)
        .single()
      
      if (subLookupError || !stripeSubscriptions) {
        console.error('Stripe subscription record not found:', subLookupError)
        return new Response(JSON.stringify({ 
          error: 'Stripe subscription record not found' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      const stripeSubId = stripeSubscriptions.stripe_subscription_id
      
      // Cancel the subscription in Stripe (at period end)
      await stripe.subscriptions.update(stripeSubId, {
        cancel_at_period_end: true
      })
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Subscription set to cancel at the end of billing period' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ 
      error: 'Invalid action' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in cancel-subscription function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
