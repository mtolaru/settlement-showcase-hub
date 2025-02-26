
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Stripe } from "https://esm.sh/stripe@14.14.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )

    // Parse request body
    let { sessionId } = await req.json()
    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient()
    })

    console.log('Retrieving session:', sessionId)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const customerId = session.customer as string
    
    if (!customerId) {
      throw new Error('No customer ID found in session')
    }

    console.log('Retrieving subscription for customer:', customerId)
    const subscription = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1
    })

    if (!subscription.data.length) {
      throw new Error('No subscription found for customer')
    }

    const sub = subscription.data[0]
    const userId = session.metadata?.userId
    const temporaryId = session.metadata?.temporaryId

    if (!userId && !temporaryId) {
      throw new Error('No user identification found in session metadata')
    }

    console.log('Updating subscription in database for user:', userId || temporaryId)
    const { error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: userId,
        temporary_id: temporaryId,
        payment_id: sub.id,
        starts_at: new Date(sub.current_period_start * 1000).toISOString(),
        ends_at: new Date(sub.current_period_end * 1000).toISOString(),
        is_active: true
      })

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError)
      throw subscriptionError
    }

    // Update pending settlements if any
    if (userId || temporaryId) {
      console.log('Updating pending settlements')
      const { error: settlementError } = await supabaseClient
        .from('settlements')
        .update({ payment_completed: true })
        .match(userId ? { user_id: userId } : { temporary_id: temporaryId })
        .eq('payment_completed', false)

      if (settlementError) {
        console.error('Error updating settlements:', settlementError)
        throw settlementError
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Subscription activated successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in verify-stripe-session:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
