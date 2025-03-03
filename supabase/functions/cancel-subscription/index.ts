
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { stripe } from '../_shared/stripe.ts'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export const handler = async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { subscriptionId, userId } = await req.json()
    
    console.log(`Cancellation request received for subscription: ${subscriptionId}`)
    
    if (!subscriptionId) {
      throw new Error('Subscription ID is required')
    }

    // Check if this is a virtual subscription (they start with "virtual-")
    if (subscriptionId.startsWith('virtual-')) {
      console.log('Cancelling virtual subscription')
      
      // For virtual subscriptions, we just need to update our database
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          is_active: false,
          ends_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        
      if (error) {
        throw new Error(`Failed to cancel virtual subscription: ${error.message}`)
      }
      
      return new Response(
        JSON.stringify({ success: true, canceled: true }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Check if this is a Stripe subscription ID (directly in Stripe)
    if (subscriptionId.startsWith('sub_')) {
      console.log('Cancelling Stripe subscription:', subscriptionId)
      
      // For Stripe subscriptions, we need to cancel in Stripe
      const canceled = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
      
      if (canceled) {
        // Also update our database
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            ends_at: new Date(canceled.cancel_at * 1000).toISOString()
          })
          .eq('payment_id', subscriptionId)
          
        if (error) {
          console.error('Error updating subscription in database:', error)
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          canceled: true,
          cancelAt: canceled.cancel_at ? new Date(canceled.cancel_at * 1000).toISOString() : null
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // If it's a UUID from our database
    if (subscriptionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Fetch the subscription to get details
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single()
        
      if (error || !subscription) {
        throw new Error(`Subscription not found: ${error?.message || 'No data'}`)
      }
      
      // If it has a Stripe payment_id, cancel in Stripe
      if (subscription.payment_id && subscription.payment_id.startsWith('sub_')) {
        console.log('Cancelling Stripe subscription from database record:', subscription.payment_id)
        
        const canceled = await stripe.subscriptions.update(subscription.payment_id, {
          cancel_at_period_end: true,
        })
        
        // Update our database
        if (canceled) {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ 
              ends_at: new Date(canceled.cancel_at * 1000).toISOString()
            })
            .eq('id', subscriptionId)
            
          if (updateError) {
            console.error('Error updating subscription in database:', updateError)
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            canceled: true,
            cancelAt: canceled.cancel_at ? new Date(canceled.cancel_at * 1000).toISOString() : null
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else {
        // No Stripe ID, just update our database
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            is_active: false,
            ends_at: new Date().toISOString()
          })
          .eq('id', subscriptionId)
          
        if (updateError) {
          throw new Error(`Failed to cancel subscription: ${updateError.message}`)
        }
        
        return new Response(
          JSON.stringify({ success: true, canceled: true }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    // If it's a stripe-XXX formatted ID (stripe customer portal)
    if (subscriptionId.startsWith('stripe-')) {
      const customerId = subscriptionId.replace('stripe-', '')
      
      // For Stripe Customer IDs, create a portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.get('origin')}/settlements`,
      })
      
      return new Response(
        JSON.stringify({ success: true, portalUrl: session.url }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // If we get here, we don't know how to handle this ID format
    throw new Error(`Unknown subscription ID format: ${subscriptionId}`)
    
  } catch (error) {
    console.error('Cancellation error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to cancel subscription' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}
