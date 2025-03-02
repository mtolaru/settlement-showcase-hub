
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
      
      // Check directly by user_id first
      const { data: userSubscription, error: userSubError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('starts_at', { ascending: false })
        .maybeSingle();

      if (userSubError) {
        console.error('Error fetching user subscription:', userSubError);
      } else if (userSubscription) {
        console.log('Found active subscription by user_id:', userSubscription);
        setSubscription(userSubscription);
        setIsLoading(false);
        return;
      }

      // If we're here, we didn't find an active subscription directly linked to the user
      
      // Check for settlements with this user's email to find temporary_id
      if (user.email) {
        const { data: emailSettlements, error: emailSettlementsError } = await supabase
          .from('settlements')
          .select('temporary_id, payment_completed')
          .eq('attorney_email', user.email)
          .eq('payment_completed', true)
          .order('created_at', { ascending: false });
          
        if (emailSettlementsError) {
          console.error('Error fetching settlements by email:', emailSettlementsError);
        } else if (emailSettlements && emailSettlements.length > 0) {
          console.log('Found settlements with matching email:', emailSettlements);
          
          // Check all temporary_ids for a subscription
          for (const settlement of emailSettlements) {
            if (settlement.temporary_id) {
              const { data: tempSubscription, error: tempSubError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('temporary_id', settlement.temporary_id)
                .eq('is_active', true)
                .maybeSingle();
                
              if (tempSubError) {
                console.error('Error fetching subscription by temporary_id:', tempSubError);
              } else if (tempSubscription) {
                console.log('Found subscription by temporary_id:', tempSubscription);
                
                // Update the subscription with user_id if needed
                if (!tempSubscription.user_id) {
                  const { error: updateError } = await supabase
                    .from('subscriptions')
                    .update({ user_id: user.id })
                    .eq('id', tempSubscription.id);
                    
                  if (updateError) {
                    console.error('Error updating subscription with user_id:', updateError);
                  } else {
                    console.log('Updated subscription with user_id');
                  }
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
