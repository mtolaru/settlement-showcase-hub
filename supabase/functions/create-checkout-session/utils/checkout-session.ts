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
  try {
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .select('payment_completed')
      .eq('temporary_id', temporaryId)
      .maybeSingle();
      
    if (settlementError) {
      console.error('Error checking settlement:', settlementError);
      throw new Error(`Failed to check existing settlement: ${settlementError.message}`);
    }
    
    if (settlement?.payment_completed) {
      console.log('Settlement already marked as paid. Skipping checkout.');
      return { isExisting: true };
    }
  } catch (dbError) {
    console.error('Database error checking settlement:', dbError);
    // Continue even if check fails - we'll try to create/update the record
  }
  
  // If form data was included, ensure it's saved to the database
  if (formData) {
    console.log('Form data included in request, ensuring it is saved to database');
    
    try {
      // Check if settlement record exists
      const { data: existingSettlement, error: checkError } = await supabase
        .from('settlements')
        .select('id')
        .eq('temporary_id', temporaryId)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking existing settlement:', checkError);
        throw new Error(`Failed to check if settlement exists: ${checkError.message}`);
      }
        
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
        console.log("Found existing settlement record, updating:", existingSettlement);
        
        // Update existing record with current form data
        const { data: updatedRecord, error: updateError } = await supabase
          .from('settlements')
          .update(settlementData)
          .eq('id', existingSettlement.id)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error updating existing settlement:", updateError);
          throw new Error(`Failed to update settlement: ${updateError.message}`);
        }
        
        console.log("Updated existing settlement record:", updatedRecord);
      } else {
        // Create a new record that includes created_at
        const newSubmissionData = {
          ...settlementData,
          created_at: new Date().toISOString()
        };
        
        console.log("Inserting new settlement record:", newSubmissionData);
        
        const { data, error: insertError } = await supabase
          .from('settlements')
          .insert(newSubmissionData)
          .select()
          .single();
          
        if (insertError) {
          console.error("Error creating settlement record:", insertError);
          throw new Error(`Failed to create settlement record: ${insertError.message}`);
        }
        
        console.log("Successfully created settlement record:", data);
      }
    } catch (saveError) {
      console.error('Error saving form data to settlements:', saveError);
      throw saveError; // Rethrow to handle in the main function
    }
  }
  
  // Define success and cancel URLs
  const encodedTempId = encodeURIComponent(temporaryId);
  const successUrl = userReturnUrl 
    ? `${userReturnUrl}?session_id={CHECKOUT_SESSION_ID}&temporaryId=${encodedTempId}` 
    : `${baseUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}&temporaryId=${encodedTempId}`;
  const cancelUrl = `${baseUrl}/submit?step=3&canceled=true&temporaryId=${encodedTempId}`;
  
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
    
    // Using the correct price ID for subscription mode
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1QwWEDDEE7vEKM2Kx3FJlc6e', // Updated to the correct price ID
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
  } catch (stripeError) {
    console.error('Stripe error creating checkout session:', stripeError);
    throw new Error(`Stripe error: ${stripeError.message}`);
  }
};
