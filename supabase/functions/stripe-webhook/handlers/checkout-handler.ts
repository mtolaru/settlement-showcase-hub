
// Process successful checkout sessions
export const handleCheckoutSession = async (session: any, supabase: any, isLiveMode: boolean) => {
  try {
    // Extract metadata from the session
    const { temporaryId, userId } = session.metadata || {};
    const sessionId = session.id;
    const subscriptionId = session.subscription;
    const customerId = session.customer;
    
    console.log(`Processing checkout.session.completed webhook with:`, {
      temporaryId,
      sessionId,
      subscriptionId,
      customerId,
      isLiveMode,
      mode: session.mode,
      paymentStatus: session.payment_status,
      subscriptionStatus: session.subscription_status || 'N/A'
    });
    
    if (!temporaryId) {
      console.error('Missing temporaryId in session metadata. Cannot process.');
      return;
    }
    
    // First check if the settlement has already been updated
    const { data: existingSettlement, error: checkError } = await supabase
      .from('settlements')
      .select('id, payment_completed')
      .eq('temporary_id', temporaryId)
      .maybeSingle();
      
    console.log('Existing settlement check:', { 
      found: !!existingSettlement, 
      paymentCompleted: existingSettlement?.payment_completed,
      error: checkError
    });
    
    if (checkError) {
      console.error('Error checking settlement:', checkError);
    }
    
    if (existingSettlement?.payment_completed) {
      console.log(`Settlement ${existingSettlement.id} already marked as paid. Skipping update.`);
      return;
    }

    // Log the customer and subscription details for debugging
    console.log(`Updating settlement for temporary ID: ${temporaryId}`);
    console.log(`Checkout session details - ID: ${sessionId}, Customer: ${customerId}, Subscription: ${subscriptionId}`);
    
    // Update the settlement record with subscription and payment information
    const { data, error } = await supabase
      .from('settlements')
      .update({
        payment_completed: true,
        stripe_session_id: sessionId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        paid_at: new Date().toISOString()
      })
      .eq('temporary_id', temporaryId)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating settlement:', error);
      throw error;
    }
    
    if (!data) {
      console.error(`No settlement found for temporaryId: ${temporaryId}`);
      return;
    }
    
    console.log(`Successfully updated settlement: ${data.id} with payment information`);
    
    // Create user association with settlement if userId is provided
    if (userId) {
      console.log(`Associating settlement with user: ${userId}`);
      const { error: userError } = await supabase
        .from('settlement_users')
        .upsert({
          settlement_id: data.id,
          user_id: userId,
          created_at: new Date().toISOString()
        });
      
      if (userError) {
        console.error('Error associating settlement with user:', userError);
      } else {
        console.log(`Successfully associated settlement ${data.id} with user ${userId}`);
      }
    }
    
    console.log('Checkout session processing completed successfully');

  } catch (error) {
    console.error('Error in handleCheckoutSession:', error);
    throw error;
  }
};
