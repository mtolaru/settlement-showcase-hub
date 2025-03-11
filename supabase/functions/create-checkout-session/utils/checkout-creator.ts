
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno';

/**
 * Create a Stripe checkout session for subscription payment
 */
export const createStripeCheckoutSession = async (
  stripe: Stripe,
  temporaryId: string,
  userId: string | undefined,
  successUrl: string,
  cancelUrl: string,
  baseUrl: string
) => {
  try {
    // Create the checkout session
    console.log('Creating Stripe checkout session with these parameters:', {
      temporaryId,
      successUrl,
      cancelUrl,
      metadata: {
        temporaryId,
        userId: userId || undefined,
        baseUrl
      }
    });
    
    // Using the correct price ID for subscription mode with $199 price
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1QwWEDDEE7vEKM2Kx3FJlc6e', // The price ID should reflect $199
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true, // Enable coupon code support
      metadata: {
        temporaryId,
        userId: userId || undefined,
        baseUrl
      },
    });
    
    console.log('Created checkout session:', {
      id: session.id,
      url: session.url,
      metadata: session.metadata
    });
    
    return session;
  } catch (stripeError) {
    console.error('Stripe error creating checkout session:', stripeError);
    throw new Error(`Stripe error: ${stripeError.message}`);
  }
};
