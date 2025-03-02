
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { 
  fetchSubscriptionByUserId, 
  fetchSubscriptionByTemporaryId, 
  findPaidSettlementsByEmail,
  linkSubscriptionToUser
} from "@/utils/subscriptionUtils";

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
      
      // Step 1: Check directly by user_id first
      const userSubscription = await fetchSubscriptionByUserId(user.id);
      if (userSubscription) {
        setSubscription(userSubscription);
        setIsLoading(false);
        return;
      }

      // Step 2: If no direct subscription, check settlements with user's email
      if (user.email) {
        const emailSettlements = await findPaidSettlementsByEmail(user.email);
        
        if (emailSettlements && emailSettlements.length > 0) {
          // Step 3: Check all temporary_ids for a subscription
          for (const settlement of emailSettlements) {
            if (settlement.temporary_id) {
              const tempSubscription = await fetchSubscriptionByTemporaryId(settlement.temporary_id);
                
              if (tempSubscription) {
                // Step 4: Update the subscription with user_id if needed
                if (!tempSubscription.user_id) {
                  await linkSubscriptionToUser(tempSubscription.id, user.id);
                }
                
                setSubscription({
                  ...tempSubscription,
                  user_id: tempSubscription.user_id || user.id
                });
                
                setIsLoading(false);
                return;
              }
            }
          }
        }
      }
      
      // If we've tried all paths and still don't have a subscription
      console.log('No active subscription found after all checks');
      setSubscription(null);
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
