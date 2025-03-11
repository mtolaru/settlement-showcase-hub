
/**
 * Generate success and cancel URLs for Stripe checkout 
 */
export const generateCheckoutUrls = (
  temporaryId: string,
  userReturnUrl: string | undefined,
  baseUrl: string
) => {
  const encodedTempId = encodeURIComponent(temporaryId);
  
  const successUrl = userReturnUrl 
    ? `${userReturnUrl}?session_id={CHECKOUT_SESSION_ID}&temporaryId=${encodedTempId}` 
    : `${baseUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}&temporaryId=${encodedTempId}`;
    
  const cancelUrl = `${baseUrl}/submit?step=3&canceled=true&temporaryId=${encodedTempId}`;
  
  return { successUrl, cancelUrl };
};
