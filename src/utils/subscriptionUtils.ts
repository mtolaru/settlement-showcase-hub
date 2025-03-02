
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Subscription } from "@/hooks/useSubscription";

/**
 * Fetches a subscription directly linked to a user's ID
 */
export const fetchSubscriptionByUserId = async (userId: string): Promise<Subscription | null> => {
  console.log('Fetching subscription by user ID:', userId);
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('starts_at', { ascending: false })
    .maybeSingle();

  if (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
  
  if (data) {
    console.log('Found active subscription by user_id:', data);
    return data;
  }
  
  return null;
};

/**
 * Finds paid settlements linked to a user's email
 */
export const findPaidSettlementsByEmail = async (email: string): Promise<{ temporary_id: string | null }[] | null> => {
  console.log('Looking for paid settlements with email:', email);
  
  const { data, error } = await supabase
    .from('settlements')
    .select('temporary_id, payment_completed')
    .eq('attorney_email', email)
    .eq('payment_completed', true)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching settlements by email:', error);
    return null;
  }
  
  if (data && data.length > 0) {
    console.log('Found settlements with matching email:', data);
    return data;
  }
  
  return null;
};

/**
 * Fetches a subscription by temporary ID
 */
export const fetchSubscriptionByTemporaryId = async (temporaryId: string): Promise<Subscription | null> => {
  console.log('Checking subscription with temporary_id:', temporaryId);
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('temporary_id', temporaryId)
    .eq('is_active', true)
    .maybeSingle();
    
  if (error) {
    console.error('Error fetching subscription by temporary_id:', error);
    return null;
  }
  
  if (data) {
    console.log('Found subscription by temporary_id:', data);
    return data;
  }
  
  return null;
};

/**
 * Updates a subscription with user ID if needed
 */
export const linkSubscriptionToUser = async (subscriptionId: string, userId: string): Promise<boolean> => {
  console.log('Linking subscription to user:', subscriptionId, userId);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({ user_id: userId })
    .eq('id', subscriptionId);
    
  if (error) {
    console.error('Error updating subscription with user_id:', error);
    return false;
  }
  
  console.log('Updated subscription with user_id');
  return true;
};
