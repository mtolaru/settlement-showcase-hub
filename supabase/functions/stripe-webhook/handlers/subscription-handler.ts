
// Process subscription updated events
export const handleSubscriptionUpdated = async (subscription: any, supabase: any) => {
  try {
    console.log(`Processing subscription.updated webhook:`, {
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId: subscription.customer
    });
    
    // Get customer ID and subscription ID
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    
    if (!customerId || !subscriptionId) {
      console.error('Missing customer or subscription ID in webhook');
      return;
    }
    
    // Find all settlements associated with this customer
    const { data: settlements, error } = await supabase
      .from('settlements')
      .select('id, stripe_subscription_id, stripe_customer_id')
      .eq('stripe_customer_id', customerId)
      .eq('stripe_subscription_id', subscriptionId);
    
    if (error) {
      console.error('Error finding settlements for customer:', error);
      throw error;
    }
    
    if (!settlements || settlements.length === 0) {
      console.log(`No settlements found for customer ${customerId} with subscription ${subscriptionId}`);
      return;
    }
    
    console.log(`Found ${settlements.length} settlements for customer ${customerId}`);
    
    // Update subscription status for all matching settlements
    for (const settlement of settlements) {
      console.log(`Updating subscription status for settlement ${settlement.id}`);
      
      const { error: updateError } = await supabase
        .from('settlements')
        .update({
          subscription_status: subscription.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', settlement.id);
      
      if (updateError) {
        console.error(`Error updating settlement ${settlement.id}:`, updateError);
      } else {
        console.log(`Successfully updated settlement ${settlement.id} with subscription status: ${subscription.status}`);
      }
    }
    
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error);
    throw error;
  }
};

// Process subscription deleted events
export const handleSubscriptionDeleted = async (subscription: any, supabase: any) => {
  try {
    console.log(`Processing subscription.deleted webhook:`, {
      subscriptionId: subscription.id,
      customerId: subscription.customer
    });
    
    // Get customer ID and subscription ID
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    
    if (!customerId || !subscriptionId) {
      console.error('Missing customer or subscription ID in webhook');
      return;
    }
    
    // Find all settlements associated with this customer and subscription
    const { data: settlements, error } = await supabase
      .from('settlements')
      .select('id, stripe_subscription_id, stripe_customer_id')
      .eq('stripe_customer_id', customerId)
      .eq('stripe_subscription_id', subscriptionId);
    
    if (error) {
      console.error('Error finding settlements for customer:', error);
      throw error;
    }
    
    if (!settlements || settlements.length === 0) {
      console.log(`No settlements found for customer ${customerId} with subscription ${subscriptionId}`);
      return;
    }
    
    console.log(`Found ${settlements.length} settlements to update for canceled subscription`);
    
    // Update subscription status for all matching settlements
    for (const settlement of settlements) {
      console.log(`Marking subscription as canceled for settlement ${settlement.id}`);
      
      const { error: updateError } = await supabase
        .from('settlements')
        .update({
          subscription_status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', settlement.id);
      
      if (updateError) {
        console.error(`Error updating settlement ${settlement.id}:`, updateError);
      } else {
        console.log(`Successfully marked subscription as canceled for settlement ${settlement.id}`);
      }
    }
    
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error);
    throw error;
  }
};
