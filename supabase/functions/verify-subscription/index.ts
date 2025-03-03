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
    // Parse the request body
    const { userId, email } = await req.json()
    
    console.log(`Verifying subscription for user: ${userId || 'none'}, email: ${email || 'none'}`)
    
    if (!userId && !email) {
      return new Response(
        JSON.stringify({ error: 'User ID or email is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Step 1: Check if we already have a subscription record with this user_id
    if (userId) {
      const { data: existingSubscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()

      if (subscriptionError) {
        console.error('Error fetching existing subscription:', subscriptionError)
      } else if (existingSubscription) {
        console.log('Found existing subscription in database:', existingSubscription)
        
        // If we have customer_id, verify with Stripe to make sure it's still active
        if (existingSubscription.customer_id) {
          try {
            const stripeSubscriptions = await stripe.subscriptions.list({
              customer: existingSubscription.customer_id,
              status: 'active',
            })
            
            if (stripeSubscriptions.data.length > 0) {
              console.log('Verified active Stripe subscription:', stripeSubscriptions.data[0].id)
              
              // Update subscription record if needed with latest Stripe data
              const stripeData = stripeSubscriptions.data[0]
              
              await supabase
                .from('subscriptions')
                .update({
                  payment_id: stripeData.id,
                  ends_at: stripeData.cancel_at ? new Date(stripeData.cancel_at * 1000).toISOString() : null
                })
                .eq('id', existingSubscription.id)
                
              return new Response(
                JSON.stringify({ 
                  subscription: {
                    ...existingSubscription,
                    payment_id: stripeData.id,
                    ends_at: stripeData.cancel_at ? new Date(stripeData.cancel_at * 1000).toISOString() : null
                  },
                  verified: true 
                }),
                { 
                  status: 200,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }
          } catch (stripeError) {
            console.error('Error verifying with Stripe:', stripeError)
          }
        } else {
          // Return the existing subscription without Stripe verification
          return new Response(
            JSON.stringify({ subscription: existingSubscription }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      }
    }

    // Step 2: If no subscription found by user_id, try to find by email
    if (email) {
      try {
        // Search for a Stripe customer by email
        const customers = await stripe.customers.list({ email: email, limit: 1 })
        
        if (customers.data.length > 0) {
          const customer = customers.data[0]
          console.log('Found Stripe customer:', customer.id)
          
          // Check for active subscriptions for this customer
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
            limit: 1
          })
          
          if (subscriptions.data.length > 0) {
            const stripeSubscription = subscriptions.data[0]
            console.log('Found active Stripe subscription:', stripeSubscription.id)
            
            // Create or update subscription record in our database
            const subscriptionData = {
              customer_id: customer.id,
              payment_id: stripeSubscription.id,
              starts_at: new Date(stripeSubscription.start_date * 1000).toISOString(),
              ends_at: stripeSubscription.cancel_at ? new Date(stripeSubscription.cancel_at * 1000).toISOString() : null,
              is_active: true,
              user_id: userId || null
            }
            
            // Check if we already have a subscription with this customer_id
            const { data: existingCustomerSub, error: customerSubError } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('customer_id', customer.id)
              .maybeSingle()
              
            if (customerSubError) {
              console.error('Error checking for existing customer subscription:', customerSubError)
            }
            
            let newSubscription
            
            if (existingCustomerSub) {
              // Update existing subscription
              const { data, error } = await supabase
                .from('subscriptions')
                .update({
                  ...subscriptionData,
                  // Keep original user_id if exists and new one is null
                  user_id: userId || existingCustomerSub.user_id
                })
                .eq('id', existingCustomerSub.id)
                .select()
                .single()
                
              if (error) {
                console.error('Error updating subscription:', error)
              } else {
                newSubscription = data
              }
            } else {
              // Create new subscription
              const { data, error } = await supabase
                .from('subscriptions')
                .insert(subscriptionData)
                .select()
                .single()
                
              if (error) {
                console.error('Error creating subscription:', error)
              } else {
                newSubscription = data
              }
            }
            
            return new Response(
              JSON.stringify({ 
                subscription: newSubscription,
                verified: true,
                stripeCustomerId: customer.id 
              }),
              { 
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }
        }
      } catch (stripeError) {
        console.error('Error checking Stripe by email:', stripeError)
      }
      
      // If we get here, no active Stripe subscription was found for the email
      console.log('No active Stripe subscription found for email:', email)
    }
    
    // Step 3: Check for paid settlements as a fallback (keeping the "virtual subscription" logic)
    if (email) {
      const { data: paidSettlements, error: settlementsError } = await supabase
        .from('settlements')
        .select('temporary_id')
        .eq('attorney_email', email)
        .eq('payment_completed', true)
        .order('created_at', { ascending: false })
        
      if (settlementsError) {
        console.error('Error checking for paid settlements:', settlementsError)
      } else if (paidSettlements && paidSettlements.length > 0) {
        console.log('Found paid settlements for email, creating virtual subscription')
        
        // Create a virtual subscription based on the paid settlement
        const virtualSubscription = {
          id: userId ? `virtual-${userId}` : null,
          starts_at: new Date().toISOString(),
          ends_at: null,
          is_active: true,
          payment_id: null,
          customer_id: null,
          temporary_id: paidSettlements[0].temporary_id,
          user_id: userId
        }
        
        return new Response(
          JSON.stringify({ 
            subscription: virtualSubscription,
            virtual: true
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    // Step 4: No subscription found
    return new Response(
      JSON.stringify({ subscription: null }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Verification error:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to verify subscription status' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}
