
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno';

/**
 * Save checkout session details to the database for easier retrieval later
 */
export const saveSessionDetails = async (
  supabase: any,
  session: any,
  temporaryId: string,
  userId: string | undefined,
  successUrl: string,
  cancelUrl: string,
  baseUrl: string
) => {
  try {
    // Store session details
    const { error } = await supabase
      .from('stripe_sessions')
      .upsert({
        session_id: session.id,
        temporary_id: temporaryId,
        user_id: userId || null,
        success_url: successUrl,
        cancel_url: cancelUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        base_url: baseUrl,
        session_data: session
      });
      
    if (error) {
      console.error('Error saving session details:', error);
    } else {
      console.log('Successfully saved session details');
    }
  } catch (error) {
    console.error('Exception in saveSessionDetails:', error);
  }
};
