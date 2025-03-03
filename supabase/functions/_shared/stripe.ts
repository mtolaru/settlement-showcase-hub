
import Stripe from 'https://esm.sh/stripe@13.9.0'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''

if (!STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use the latest stable API version
  httpClient: Stripe.createFetchHttpClient()
})
