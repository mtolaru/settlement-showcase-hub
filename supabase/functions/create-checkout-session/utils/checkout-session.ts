
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno';
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types for request data
export interface CheckoutRequestData {
  temporaryId: string;
  userId?: string;
  returnUrl?: string;
  formData?: any;
}

// Create Stripe checkout session
export const createCheckoutSession = async (
  stripe: Stripe,
  supabase: SupabaseClient,
  data: CheckoutRequestData,
  baseUrl: string
) => {
  const { temporaryId, userId } = data;
  
  // First check for existing sessions for this temporaryId to avoid rate-limiting
  const { data: existingSession, error: sessionCheckError } = await supabase
    .from('stripe_sessions')
    .select('session_data')
    .eq('temporary_id', temporaryId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (!sessionCheckError && existingSession?.session_data?.url) {
    console.log("Found existing checkout session for this temporaryId:", existingSession.session_data);
    
    // If session exists and was created recently (within last hour), reuse it
    const sessionCreatedAt = existingSession.session_data.created_at ? 
      new Date(existingSession.session_data.created_at) : 
      null;
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    if (sessionCreatedAt && sessionCreatedAt > oneHourAgo) {
      console.log("Reusing recent checkout session to avoid rate limiting");
      return {
        session: {
          id: existingSession.session_data.session_id,
          url: existingSession.session_data.url
        }
      };
    }
  }
  
  // Check if this temporaryId already has a completed payment
  const { data: existingSettlement, error: checkError } = await supabase
    .from('settlements')
    .select('id, payment_completed')
    .eq('temporary_id', temporaryId)
    .eq('payment_completed', true)
    .maybeSingle();

  if (!checkError && existingSettlement?.id) {
    console.log("Found existing settlement with this temporaryId:", existingSettlement.id);
    
    return {
      isExisting: true,
      message: "This settlement has already been processed"
    };
  }
  
  // Make sure temporaryId is properly encoded
  const encodedTempId = encodeURIComponent(temporaryId);
  
  // IMPORTANT: Always use /confirmation as the primary success route directly
  const successUrl = `${baseUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}&temporaryId=${encodedTempId}`;
  const cancelUrl = `${baseUrl}/submit?step=3&canceled=true`;
  
  console.log("Success URL:", successUrl);
  console.log("Cancel URL:", cancelUrl);

  // Create the checkout session
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Professional Plan Subscription',
              description: 'Monthly subscription for publishing settlements',
            },
            unit_amount: 19900, // $199.00
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: temporaryId,
      metadata: {
        temporaryId: temporaryId,
        userId: userId || '',
        baseUrl: baseUrl // Store the base URL in metadata for reference
      },
      allow_promotion_codes: true,
    });

    console.log("Checkout session created:", {
      sessionId: session.id,
      url: session.url,
      successUrl: successUrl,
      temporaryId: temporaryId,
      baseUrl: baseUrl
    });
    
    // Save session details for potential reuse
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
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    
    if (error.type === 'StripeRateLimitError') {
      // If rate limited, wait and try to fetch existing session as fallback
      const { data: latestSession } = await supabase
        .from('stripe_sessions')
        .select('session_data')
        .eq('temporary_id', temporaryId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (latestSession?.session_data?.url) {
        console.log("Using existing session due to rate limiting");
        return {
          session: {
            id: latestSession.session_data.session_id,
            url: latestSession.session_data.url
          }
        };
      }
    }
    
    throw error;
  }
};

// Save session details to database
export const saveSessionDetails = async (
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  temporaryId: string,
  userId: string | undefined,
  successUrl: string,
  cancelUrl: string,
  baseUrl: string
) => {
  try {
    const { error: sessionLogError } = await supabase
      .from('stripe_sessions')
      .insert({
        session_id: session.id,
        temporary_id: temporaryId,
        user_id: userId || null,
        created_at: new Date().toISOString(),
        session_data: {
          payment_status: session.payment_status,
          url: session.url,
          success_url: successUrl,
          cancel_url: cancelUrl,
          base_url: baseUrl,
          session_id: session.id,
          created_at: new Date().toISOString()
        }
      });
      
    if (sessionLogError) {
      console.error("Error logging session details:", sessionLogError);
      return false;
    } else {
      console.log("Successfully logged session details");
      return true;
    }
  } catch (logError) {
    console.error("Exception logging session:", logError);
    return false;
  }
};
