
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { Stripe } from 'https://esm.sh/stripe@13.8.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle OPTIONS request for CORS
const handleOptions = () => {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleOptions()
  }

  try {
    // Get request body
    const { subscriptionId } = await req.json()

    // Check if we have the necessary data
    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ error: 'Missing subscription ID' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client with the user's JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    // Get user information
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase admin client for sensitive operations
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })

    // Get subscription from database to verify ownership
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Subscription not found or not owned by user' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if subscription has a Stripe payment ID
    if (subscription.payment_id) {
      try {
        // Cancel the subscription in Stripe
        await stripe.subscriptions.cancel(subscription.payment_id)
        console.log(`Stripe subscription ${subscription.payment_id} canceled`)
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError)
        // Continue anyway - we'll update our database
      }
    }

    // Mark subscription as cancelled in our database
    const now = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        is_active: false,
        ends_at: now
      })
      .eq('id', subscriptionId)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Hide settlements instead of deleting them
    const { error: hideError } = await supabaseAdmin
      .from('settlements')
      .update({ hidden: true })
      .eq('user_id', user.id)
      .is('payment_completed', true)
      .is('hidden', false)

    if (hideError) {
      console.error('Error hiding settlements:', hideError)
      // Continue anyway to return success for the cancellation
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Subscription canceled successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
