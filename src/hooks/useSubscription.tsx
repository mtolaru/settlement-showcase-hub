
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";

export interface Subscription {
  id: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  payment_id: string | null;
  temporary_id: string | null;
  user_id: string | null;
}

export const useSubscription = (user: User | null) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      if (!user) {
        console.log('No user found, skipping subscription fetch');
        setIsLoading(false);
        return;
      }

      console.log('Fetching subscription for user:', user.id);
      
      // Try to find subscription by user_id first
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('starts_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        throw error;
      }

      console.log('Found subscription by user_id:', subscriptionData);
      
      if (subscriptionData) {
        setSubscription(subscriptionData);
        setIsLoading(false);
        return;
      }
      
      console.log('No active subscription found by user_id');
      
      // Try to fetch by temporary ID if no direct user_id match
      if (user.user_metadata?.temporaryId) {
        const tempId = user.user_metadata.temporaryId;
        console.log('Checking for subscription with temporary_id:', tempId);
        
        const { data: tempSubscription, error: tempError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('temporary_id', tempId)
          .eq('is_active', true)
          .maybeSingle();
          
        if (tempError) {
          console.error('Error fetching subscription by temporary_id:', tempError);
        } else if (tempSubscription) {
          console.log('Found subscription by temporary_id:', tempSubscription);
          
          // Update the subscription with the user_id
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ user_id: user.id })
            .eq('id', tempSubscription.id);
            
          if (updateError) {
            console.error('Error updating subscription with user_id:', updateError);
          } else {
            console.log('Updated subscription with user_id');
            // Set the updated subscription
            setSubscription({
              ...tempSubscription,
              user_id: user.id
            });
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Also try to match any orphaned subscriptions by email
      if (user.email) {
        console.log('Checking for orphaned subscriptions with matching email in settlements table');
        
        // First, get settlements linked to the user's email
        const { data: settlements, error: settlementsError } = await supabase
          .from('settlements')
          .select('temporary_id')
          .eq('attorney_email', user.email)
          .is('user_id', null);
          
        if (settlementsError) {
          console.error('Error fetching settlements by email:', settlementsError);
        } else if (settlements && settlements.length > 0) {
          console.log('Found settlements with matching email:', settlements);
          
          // Check for subscriptions with these temporary_ids
          const tempIds = settlements.map(s => s.temporary_id).filter(Boolean);
          
          if (tempIds.length > 0) {
            const { data: orphanedSubs, error: orphanedError } = await supabase
              .from('subscriptions')
              .select('*')
              .in('temporary_id', tempIds)
              .is('user_id', null)
              .eq('is_active', true);
              
            if (orphanedError) {
              console.error('Error fetching orphaned subscriptions:', orphanedError);
            } else if (orphanedSubs && orphanedSubs.length > 0) {
              console.log('Found orphaned subscription(s):', orphanedSubs);
              
              // Update the first orphaned subscription with user_id
              const subToUpdate = orphanedSubs[0];
              const { error: updateError } = await supabase
                .from('subscriptions')
                .update({ user_id: user.id })
                .eq('id', subToUpdate.id);
                
              if (updateError) {
                console.error('Error updating orphaned subscription:', updateError);
              } else {
                console.log('Updated orphaned subscription with user_id');
                setSubscription({
                  ...subToUpdate,
                  user_id: user.id
                });
                
                // Also update associated settlements
                if (subToUpdate.temporary_id) {
                  const { error: settlementUpdateError } = await supabase
                    .from('settlements')
                    .update({ user_id: user.id })
                    .eq('temporary_id', subToUpdate.temporary_id);
                    
                  if (settlementUpdateError) {
                    console.error('Error updating settlements:', settlementUpdateError);
                  } else {
                    console.log('Updated settlements with user_id');
                  }
                }
                
                setIsLoading(false);
                return;
              }
            }
          }
        }
      }
      
      // Check directly for any settlements with the user's email, regardless of user_id
      if (user.email) {
        console.log('Checking for any settlements with matching email:', user.email);
        
        const { data: emailSettlements, error: emailSettlementsError } = await supabase
          .from('settlements')
          .select('temporary_id, payment_completed')
          .eq('attorney_email', user.email)
          .order('created_at', { ascending: false });
          
        if (emailSettlementsError) {
          console.error('Error fetching settlements by email:', emailSettlementsError);
        } else if (emailSettlements && emailSettlements.length > 0) {
          console.log('Found settlements with matching email, checking for subscription:', emailSettlements);
          
          // If there's at least one paid settlement, we should look for a subscription
          const paidSettlement = emailSettlements.find(s => s.payment_completed);
          
          if (paidSettlement && paidSettlement.temporary_id) {
            // Check if there's a subscription with this temporary_id
            const { data: linkedSub, error: linkedSubError } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('temporary_id', paidSettlement.temporary_id)
              .maybeSingle();
              
            if (linkedSubError) {
              console.error('Error fetching linked subscription:', linkedSubError);
            } else if (linkedSub) {
              console.log('Found subscription linked to paid settlement:', linkedSub);
              
              // Update the subscription with the user_id if not already set
              if (!linkedSub.user_id) {
                const { error: updateSubError } = await supabase
                  .from('subscriptions')
                  .update({ user_id: user.id })
                  .eq('id', linkedSub.id);
                  
                if (updateSubError) {
                  console.error('Error updating subscription with user_id:', updateSubError);
                } else {
                  console.log('Updated subscription with user_id');
                }
              }
              
              // Set the subscription
              setSubscription({
                ...linkedSub,
                user_id: linkedSub.user_id || user.id
              });
              
              // Update any settlements with this temporary_id to have the correct user_id
              const { error: updateSetError } = await supabase
                .from('settlements')
                .update({ user_id: user.id })
                .eq('temporary_id', paidSettlement.temporary_id)
                .is('user_id', null);
                
              if (updateSetError) {
                console.error('Error updating settlements with user_id:', updateSetError);
              } else {
                console.log('Updated settlements with user_id');
              }
              
              setIsLoading(false);
              return;
            }
          }
        }
      }
      
      // If we get here, no subscription was found
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch subscription status. Please try again.",
      });
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    } else {
      setSubscription(null);
      setIsLoading(false);
    }
  }, [user, fetchSubscriptionStatus]);

  return {
    subscription,
    isLoading,
    refreshSubscription: fetchSubscriptionStatus
  };
};
