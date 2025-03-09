
// Handle customer.subscription.updated events
export const handleSubscriptionUpdated = async (subscription: any, supabase: any) => {
  console.log('Processing subscription update:', subscription.id, 'Status:', subscription.status);
  
  // Try to find any subscription record with this customer
  const { data: subscriptions, error: findError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('customer_id', subscription.customer)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (findError) {
    console.error('Error finding subscription by customer ID:', findError);
  } else if (subscriptions && subscriptions.length > 0) {
    // Found a subscription with this customer ID, update it
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        is_active: subscription.status === 'active',
        ends_at: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString() 
          : null
      })
      .eq('id', subscriptions[0].id);
      
    if (updateError) {
      console.error('Error updating subscription:', updateError);
    } else {
      console.log('Successfully updated subscription for customer', subscription.customer);
    }
  } else {
    // Fallback: try to update by payment_id if it matches the latest invoice
    console.log('No subscription found with customer ID, trying alternative lookup methods');
    
    if (subscription.latest_invoice) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          is_active: subscription.status === 'active',
          ends_at: subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString() 
            : null,
          // Also update the customer ID for future reference
          customer_id: subscription.customer
        })
        .eq('payment_id', subscription.latest_invoice);
        
      if (updateError) {
        console.error('Error updating subscription by invoice:', updateError);
      } else {
        console.log('Successfully updated subscription by invoice reference');
      }
    }
  }
};

// Handle customer.subscription.deleted events
export const handleSubscriptionDeleted = async (subscription: any, supabase: any) => {
  console.log('Processing subscription deletion:', subscription.id);
  
  // Try to find and update any subscription with this customer ID
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      is_active: false,
      ends_at: new Date().toISOString() // End immediately
    })
    .eq('customer_id', subscription.customer);
    
  if (updateError) {
    console.error('Error marking subscription as inactive:', updateError);
  } else {
    console.log('Successfully marked subscription as inactive for customer', subscription.customer);
  }
};
