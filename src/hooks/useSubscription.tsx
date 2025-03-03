
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Subscription {
  id: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  payment_id: string | null;
  customer_id: string | null;
  temporary_id: string | null;
  user_id: string | null;
}

export const useSubscription = (user: User | null) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();

  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      if (!user) {
        console.log('No user found, skipping subscription fetch');
        setIsLoading(false);
        return;
      }

      console.log('Fetching subscription for user:', user.id);
      
      // First check with Stripe via the verify-subscription edge function
      console.log('Calling verify-subscription function first');
      const response = await supabase.functions.invoke('verify-subscription', {
        body: {
          userId: user.id,
          email: user.email,
        },
      });

      if (response.error) {
        console.error('Error from verify-subscription function:', response.error);
        throw new Error(response.error.message);
      }

      const data = response.data;
      console.log('Subscription verification response:', data);
      
      let stripeSubscription = null;
      if (data.subscription) {
        stripeSubscription = data.subscription;
        setSubscription(data.subscription);
        setIsVerified(!!data.verified);
        
        // If this is a verified Stripe subscription with user_id null,
        // update the database to link it to this user
        if (data.verified && data.subscription.customer_id && !data.subscription.user_id) {
          console.log('Linking Stripe subscription to user:', user.id);
          await supabase
            .from('subscriptions')
            .update({ user_id: user.id })
            .eq('customer_id', data.subscription.customer_id);
        }
      }
      
      // If no Stripe subscription was found, check the database for a local subscription
      if (!stripeSubscription) {
        console.log('No Stripe subscription found, checking local database');
        
        const { data: localSubscriptions, error: localError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('starts_at', { ascending: false })
          .limit(1);
        
        if (localError) {
          console.error('Error fetching local subscription:', localError);
          throw localError;
        }
        
        console.log('Local subscriptions:', localSubscriptions);
        
        // If we have a local subscription, use it
        if (localSubscriptions && localSubscriptions.length > 0) {
          const localSub = localSubscriptions[0];
          console.log('Using local subscription:', localSub);
          
          setSubscription({
            id: localSub.id,
            starts_at: localSub.starts_at,
            ends_at: localSub.ends_at,
            is_active: localSub.is_active,
            payment_id: localSub.payment_id,
            customer_id: localSub.customer_id,
            temporary_id: localSub.temporary_id,
            user_id: localSub.user_id
          });
        } else {
          setSubscription(null);
        }
      }
      
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
    isVerified,
    refreshSubscription: fetchSubscriptionStatus
  };
};
