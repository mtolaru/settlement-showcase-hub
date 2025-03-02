
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Stripe from 'https://esm.sh/stripe@12.18.0'

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
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })
    
    // Get the session to verify the user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('Error fetching session or no session:', sessionError)
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Get request body
    const { subscriptionId } = await req.json()
    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: 'Missing subscription ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Get the user's ID from the session
    const userId = session.user.id
    console.log(`Processing subscription cancellation for user ${userId}, subscription ID: ${subscriptionId}`)
    
    // Verify the subscription belongs to the user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single()
      
    if (subError || !subscription) {
      console.error('Error fetching subscription or not found:', subError)
      return new Response(JSON.stringify({ error: 'Subscription not found or does not belong to user' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // If there's no Stripe payment_id, just update our database
    if (!subscription.payment_id) {
      console.log('No payment ID found, updating subscription directly in database')
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ 
          is_active: false,
          ends_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        
      if (updateError) {
        console.error('Error updating subscription:', updateError)
        return new Response(JSON.stringify({ error: 'Failed to update subscription' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      return new Response(JSON.stringify({ 
        message: 'Subscription canceled successfully', 
        canceled_immediately: true
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Initialize Stripe with the secret key
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })
    
    // Cancel the subscription in Stripe
    // By default, this will cancel at period end (not immediately)
    const stripeSubscription = await stripe.subscriptions.update(subscription.payment_id, {
      cancel_at_period_end: true,
    })
    
    console.log('Stripe subscription updated:', stripeSubscription.id, 'Status:', stripeSubscription.status)
    
    // Update our database with the cancellation information
    // Note: The webhook will eventually update this too, but we update now for immediate user feedback
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        // Only mark as inactive if Stripe canceled immediately
        is_active: stripeSubscription.status !== 'canceled',
        // Set ends_at to the current period end from Stripe
        ends_at: new Date(stripeSubscription.current_period_end * 1000).toISOString()
      })
      .eq('id', subscriptionId)
      
    if (updateError) {
      console.error('Error updating subscription:', updateError)
      // We still return success since Stripe processed it
      console.log('Stripe processed cancellation but database update failed')
    }
    
    return new Response(JSON.stringify({ 
      message: 'Subscription canceled successfully',
      canceled_immediately: stripeSubscription.status === 'canceled',
      active_until: new Date(stripeSubscription.current_period_end * 1000).toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
