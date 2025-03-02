
import { useState, useEffect } from "react";
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
}

export const useSubscription = (user: User | null) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubscriptionStatus = async () => {
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
          setSubscription(tempSubscription);
          
          // Update the subscription with the user_id
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
  };

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  return {
    subscription,
    isLoading,
    refreshSubscription: fetchSubscriptionStatus
  };
};
