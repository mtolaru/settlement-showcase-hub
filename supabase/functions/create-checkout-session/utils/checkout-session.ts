
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno';
import { saveSessionDetails } from './session-storage.ts';
import { saveSettlementData, checkExistingPayment } from './settlement-data.ts';
import { createStripeCheckoutSession } from './checkout-creator.ts';
import { generateCheckoutUrls } from './url-utils.ts';

// Create checkout session
export const createCheckoutSession = async (
  stripe: Stripe,
  supabase: any,
  requestData: any,
  baseUrl: string
) => {
  const { temporaryId, userId, returnUrl: userReturnUrl, formData } = requestData;
  
  if (!temporaryId) {
    throw new Error('Missing temporaryId in request');
  }
  
  console.log('Creating checkout session for temporaryId:', temporaryId);
  console.log('Base URL:', baseUrl);
  
  // Check if payment has already been completed
  const paymentCompleted = await checkExistingPayment(supabase, temporaryId);
  if (paymentCompleted) {
    console.log('Settlement already marked as paid. Skipping checkout.');
    return { isExisting: true };
  }
  
  // If form data was included, ensure it's saved to the database
  if (formData) {
    console.log('Form data included in request, ensuring it is saved to database');
    try {
      await saveSettlementData(supabase, temporaryId, formData);
    } catch (saveError) {
      console.error('Error saving form data to settlements:', saveError);
      throw saveError; // Rethrow to handle in the main function
    }
  }
  
  // Generate URLs for Stripe checkout
  const { successUrl, cancelUrl } = generateCheckoutUrls(temporaryId, userReturnUrl, baseUrl);
  
  try {
    // Create the checkout session
    const session = await createStripeCheckoutSession(
      stripe,
      temporaryId,
      userId,
      successUrl,
      cancelUrl,
      baseUrl
    );
    
    // Save the session details for future reference
    await saveSessionDetails(
      supabase,
      session,
      temporaryId,
      userId,
      successUrl,
      cancelUrl,
      baseUrl
    );
    
    return { session };
  } catch (stripeError) {
    console.error('Stripe error creating checkout session:', stripeError);
    throw new Error(`Stripe error: ${stripeError.message}`);
  }
};

// Export the old function name for backwards compatibility
export { saveSessionDetails } from './session-storage.ts';
