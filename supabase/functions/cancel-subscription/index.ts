
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    const { subscriptionId } = await req.json()
    console.log('Received request to cancel subscription:', subscriptionId)

    // First, get the subscription details from our database
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single()

    if (subscriptionError || !subscriptionData) {
      console.error('Error fetching subscription:', subscriptionError)
      return new Response(
        JSON.stringify({ 
          error: 'Subscription not found',
          details: subscriptionError 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Check if this is a "virtual" subscription that we've created for certain cases
    const isVirtualSubscription = 
      subscriptionId.startsWith('virtual-') || 
      subscriptionId.startsWith('stripe-')

    if (isVirtualSubscription) {
      // For virtual subscriptions, we just update our database
      console.log('Handling virtual subscription cancellation')
      const now = new Date()
      const endDate = new Date()
      endDate.setDate(now.getDate() + 30) // Give them 30 more days
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ 
          is_active: true,  // Still active until end date
          ends_at: endDate.toISOString() 
        })
        .eq('id', subscriptionId)
        .select()
        
      if (error) {
        console.error('Error updating virtual subscription:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to cancel subscription', details: error }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }
      
      return new Response(
        JSON.stringify({
          id: subscriptionId,
          canceled_immediately: false,
          active_until: endDate.toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    } else {
      // For real Stripe subscriptions, we need to redirect to Stripe's cancellation page
      if (!subscriptionData.payment_id) {
        console.error('No payment_id found for subscription')
        return new Response(
          JSON.stringify({ error: 'No payment ID associated with this subscription' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }
      
      try {
        console.log('Creating Stripe portal session with customer ID:', subscriptionData.customer_id || 'Using payment_id as fallback');
        
        // Create a customer portal session for cancellation
        const session = await stripe.billingPortal.sessions.create({
          customer: subscriptionData.customer_id || subscriptionData.payment_id,
          return_url: `${req.headers.get('origin') || 'https://your-app-url.com'}/manage`,
        });
        
        console.log('Created Stripe portal session:', session.url);
        
        // Return the session URL so the frontend can redirect to it
        return new Response(
          JSON.stringify({ 
            redirectUrl: session.url 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } catch (stripeError) {
        console.error('Stripe error:', stripeError)
        return new Response(
          JSON.stringify({ 
            error: 'Error creating Stripe cancellation session',
            details: stripeError 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }
    }
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
