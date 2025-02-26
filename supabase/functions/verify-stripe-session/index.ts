
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Stripe } from "https://esm.sh/stripe@14.14.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

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

  const { sessionId } = await req.json()
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient()
  })

  const session = await stripe.checkout.sessions.retrieve(sessionId)
  const customerId = session.customer as string
  const subscription = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1
  })

  const sub = subscription.data[0]
  const userId = session.metadata?.userId
  const temporaryId = session.metadata?.temporaryId

  await supabaseClient
    .from('subscriptions')
    .upsert({
      user_id: userId,
      temporary_id: temporaryId,
      payment_id: sub.id,
      starts_at: new Date(sub.current_period_start * 1000).toISOString(),
      ends_at: new Date(sub.current_period_end * 1000).toISOString(),
      is_active: true
    })

  if (userId || temporaryId) {
    await supabaseClient
      .from('settlements')
      .update({ payment_completed: true })
      .match(userId ? { user_id: userId } : { temporary_id: temporaryId })
      .eq('payment_completed', false)
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
