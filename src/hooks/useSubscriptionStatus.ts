
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useSubscriptionStatus = (
  setHasActiveSubscription: (value: boolean) => void,
  setIsCheckingSubscription: (value: boolean) => void
) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log("Checking subscription status for user:", session.user.id);
        
        const { data: subscriptions, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .gt('ends_at', new Date().toISOString())
          .maybeSingle();

        if (error) {
          console.error('Error checking subscription:', error);
          throw error;
        }
        
        console.log("Subscription query result:", subscriptions);
        
        const hasActiveSub = !!subscriptions;
        console.log("Setting hasActiveSubscription to:", hasActiveSub);
        
        setHasActiveSubscription(hasActiveSub);
        
        if (!hasActiveSub) {
          const { data: openSubscriptions, error: openError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .is('ends_at', null)
            .maybeSingle();
            
          if (openError) {
            console.error('Error checking open-ended subscription:', openError);
          } else {
            console.log("Open-ended subscription check result:", openSubscriptions);
            if (openSubscriptions) {
              console.log("Found open-ended subscription, setting hasActiveSubscription to true");
              setHasActiveSubscription(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify subscription status. Please try again.",
      });
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      checkSubscriptionStatus();
    }
  }, [user?.id]);

  return { checkSubscriptionStatus };
};
