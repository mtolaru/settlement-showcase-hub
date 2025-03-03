
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.3.0'

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
    // Get env variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''

    // Create Supabase client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    })

    // Parse request body
    const { userId, email } = await req.json()
    console.log('Verifying subscription for user:', userId, 'Email:', email)

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId and email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // First, try to find a subscription by customer ID or email in Stripe
    console.log('Checking for Stripe subscriptions...')
    
    // Get Stripe customer with the matching email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })
    
    let stripeSubscription = null
    let existingSubInDb = null

    // If we have a customer, check for active subscriptions
    if (customers.data.length > 0) {
      const customerId = customers.data[0].id
      console.log('Found Stripe customer:', customerId)
      
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1
      })
      
      if (subscriptions.data.length > 0) {
        const stripeSub = subscriptions.data[0]
        console.log('Found active Stripe subscription:', stripeSub.id)
        
        // Check if this subscription is already in our database
        const { data: existingSub, error: subError } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('customer_id', customerId)
          .maybeSingle()
          
        if (subError) {
          console.error('Error checking existing DB subscription:', subError)
        }
        
        if (existingSub) {
          console.log('Found existing subscription in database:', existingSub.id)
          existingSubInDb = existingSub
          
          // If the subscription doesn't have a user_id, update it
          if (!existingSub.user_id) {
            const { error: updateError } = await supabaseAdmin
              .from('subscriptions')
              .update({ user_id: userId })
              .eq('id', existingSub.id)
              
            if (updateError) {
              console.error('Error updating subscription with user_id:', updateError)
            } else {
              console.log('Updated subscription with user_id:', userId)
              existingSubInDb.user_id = userId
            }
          }
        } else {
          // Create a new subscription record in the database
          const newSubscription = {
            id: stripe.subscriptions.id,
            user_id: userId,
            customer_id: customerId,
            payment_id: stripeSub.id,
            starts_at: new Date(stripeSub.current_period_start * 1000).toISOString(),
            ends_at: stripeSub.cancel_at 
              ? new Date(stripeSub.cancel_at * 1000).toISOString() 
              : null,
            is_active: true
          }
          
          console.log('Creating new subscription record:', newSubscription)
          
          const { data: createdSub, error: createError } = await supabaseAdmin
            .from('subscriptions')
            .insert(newSubscription)
            .select()
            .single()
            
          if (createError) {
            console.error('Error creating subscription record:', createError)
          } else {
            console.log('Created new subscription record:', createdSub)
            existingSubInDb = createdSub
          }
        }
      }
    }
    
    // If we found a subscription in the database through Stripe
    if (existingSubInDb) {
      return new Response(
        JSON.stringify({ subscription: existingSubInDb }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // As a fallback, check the database directly for a subscription by user_id
    const { data: userSubscription, error: userSubError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()
      
    if (userSubError) {
      console.error('Error checking user subscription:', userSubError)
    }
    
    if (userSubscription) {
      console.log('Found subscription by user_id in database:', userSubscription)
      return new Response(
        JSON.stringify({ subscription: userSubscription }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // No subscription found
    console.log('No subscription found for user')
    return new Response(
      JSON.stringify({ subscription: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in verify-subscription function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
