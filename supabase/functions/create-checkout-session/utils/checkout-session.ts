
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno';

// Save session details for easier retrieval later
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
        base_url: baseUrl,
        session_data: session
      });
      
    if (error) {
      console.error('Error saving session details:', error);
    } else {
      console.log('Successfully saved session details');
    }
  } catch (error) {
    console.error('Error in saveSessionDetails:', error);
  }
};

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
  const { data: settlement, error: settlementError } = await supabase
    .from('settlements')
    .select('payment_completed')
    .eq('temporary_id', temporaryId)
    .maybeSingle();
    
  if (settlementError) {
    console.error('Error checking settlement:', settlementError);
  }
  
  if (settlement?.payment_completed) {
    console.log('Settlement already marked as paid. Skipping checkout.');
    return { isExisting: true };
  }
  
  // If form data was included, ensure it's saved to the database
  if (formData) {
    console.log('Form data included in request, ensuring it is saved to database');
    
    try {
      // Check if settlement record exists
      const { data: existingSettlement } = await supabase
        .from('settlements')
        .select('id')
        .eq('temporary_id', temporaryId)
        .maybeSingle();
        
      // Format the data for insertion
      const settlementData = {
        temporary_id: temporaryId,
        amount: Number(formData.amount?.replace?.(/[^0-9.]/g, '') || 0) || 0,
        attorney: formData.attorneyName || '',
        firm: formData.firmName || '',
        firm_website: formData.firmWebsite || '',
        location: formData.location || '',
        type: formData.caseType === "Other" ? formData.otherCaseType || 'Other' : formData.caseType || 'Other',
        description: formData.caseDescription || '',
        case_description: formData.caseDescription || '',
        initial_offer: formData.initialOffer ? Number(formData.initialOffer.replace(/[^0-9.]/g, '')) : null,
        policy_limit: formData.policyLimit ? Number(formData.policyLimit.replace(/[^0-9.]/g, '')) : null,
        medical_expenses: formData.medicalExpenses ? Number(formData.medicalExpenses.replace(/[^0-9.]/g, '')) : null,
        settlement_phase: formData.settlementPhase || '',
        settlement_date: formData.settlementDate || null,
        photo_url: formData.photoUrl || '',
        attorney_email: formData.attorneyEmail || '',
        payment_completed: false,
        updated_at: new Date().toISOString()
      };
      
      if (existingSettlement) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('settlements')
          .update(settlementData)
          .eq('id', existingSettlement.id);
          
        if (updateError) {
          console.error('Error updating settlement with form data:', updateError);
        } else {
          console.log('Updated existing settlement with form data');
        }
      } else {
        // Create new record
        settlementData.created_at = new Date().toISOString();
        
        const { error: insertError } = await supabase
          .from('settlements')
          .insert(settlementData);
          
        if (insertError) {
          console.error('Error creating settlement with form data:', insertError);
        } else {
          console.log('Created new settlement with form data');
        }
      }
    } catch (saveError) {
      console.error('Error saving form data to settlements:', saveError);
    }
  }
  
  // Define success and cancel URLs
  const encodedTempId = encodeURIComponent(temporaryId);
  const successUrl = userReturnUrl 
    ? `${userReturnUrl}?session_id={CHECKOUT_SESSION_ID}&temporaryId=${encodedTempId}` 
    : `${baseUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}&temporaryId=${encodedTempId}`;
  const cancelUrl = `${baseUrl}/submit?step=3&canceled=true&temporaryId=${encodedTempId}`;
  
  // Create the checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Settlement Submission',
            description: 'One-time fee to submit your settlement information',
          },
          unit_amount: 9900, // $99.00
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
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
  
  return { session };
};
