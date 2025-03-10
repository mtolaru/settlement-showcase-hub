
// Handle checkout.session.completed events
export const handleCheckoutSession = async (session: any, supabase: any, isLiveMode: boolean) => {
  console.log('Processing completed checkout session:', session.id);

  const userId = session.metadata?.userId;
  const temporaryId = session.metadata?.temporaryId;
  const customerId = session.customer;
  const paymentId = session.payment_intent || session.id; // Fallback to session ID if payment_intent not available

  if (!userId && !temporaryId) {
    console.error('No user ID or temporary ID found in session metadata:', session.metadata);
    throw new Error('No user ID or temporary ID found in session metadata');
  }

  console.log('Creating subscription with data:', {
    userId,
    temporaryId,
    customerId,
    paymentId,
    isLiveMode
  });

  // Create a new subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      temporary_id: temporaryId,
      starts_at: new Date().toISOString(),
      is_active: true,
      payment_id: paymentId,
      customer_id: customerId, // Store the customer ID for future use
      is_live_mode: isLiveMode // Track whether this is a live or test mode payment
    });

  if (subscriptionError) {
    console.error('Error creating subscription:', subscriptionError);
    throw subscriptionError;
  }

  console.log('Successfully created subscription record with customer ID:', customerId);
  
  await updateSettlementPaymentStatus(supabase, temporaryId, userId);
};

// Update settlement payment status
async function updateSettlementPaymentStatus(supabase: any, temporaryId: string | undefined, userId: string | undefined) {
  // Update any existing settlement with the user ID (if available) and mark as payment completed
  if (temporaryId) {
    let updateData: any = { payment_completed: true };
    
    // If userId is available, also update it
    if (userId) {
      updateData.user_id = userId;
    }
    
    const { error: settlementError } = await supabase
      .from('settlements')
      .update(updateData)
      .eq('temporary_id', temporaryId);
      
    if (settlementError) {
      console.error('Error updating settlement status:', settlementError);
    } else {
      console.log('Successfully marked settlement as paid and assigned user ID (if available)');
    }
  }
  
  // If we have a userId but no temporaryId, update any settlements for this user that aren't marked as completed
  if (userId && !temporaryId) {
    const { error: userSettlementError } = await supabase
      .from('settlements')
      .update({ payment_completed: true })
      .eq('user_id', userId)
      .eq('payment_completed', false);
      
    if (userSettlementError) {
      console.error('Error updating user settlements:', userSettlementError);
    } else {
      console.log('Successfully marked all user settlements as paid');
    }
  }
}
