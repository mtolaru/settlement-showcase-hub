
import { useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import debounce from "lodash.debounce";

export const useSubscriptionStatus = (
  setHasActiveSubscription: (value: boolean) => void,
  setIsCheckingSubscription: (value: boolean) => void
) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const checkRunRef = useRef(false);
  const isCheckingRef = useRef(false);

  // Debounce the subscription check to prevent rapid API calls
  const debouncedCheckSubscription = useCallback(
    debounce(async () => {
      if (!user?.id || isCheckingRef.current) {
        return;
      }
      
      isCheckingRef.current = true;
      
      try {
        console.log("Checking subscription status for user:", user.id);
        
        const { data: subscriptions, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gt('ends_at', new Date().toISOString())
          .maybeSingle();

        if (error) {
          console.error('Error checking subscription:', error);
          throw error;
        }
        
        console.log("Setting hasActiveSubscription to:", !!subscriptions);
        setHasActiveSubscription(!!subscriptions);
        
      } catch (error) {
        console.error('Error checking subscription:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to verify subscription status",
        });
      } finally {
        setIsCheckingSubscription(false);
        isCheckingRef.current = false;
      }
    }, 1000),
    [user?.id, setHasActiveSubscription, setIsCheckingSubscription, toast]
  );

  // Run subscription check only when user ID changes and hasn't been checked
  useEffect(() => {
    if (user?.id && !checkRunRef.current) {
      checkRunRef.current = true;
      setIsCheckingSubscription(true);
      debouncedCheckSubscription();
    } else if (!user?.id) {
      checkRunRef.current = false;
      setIsCheckingSubscription(false);
    }
    
    return () => {
      debouncedCheckSubscription.cancel();
    };
  }, [user?.id, debouncedCheckSubscription, setIsCheckingSubscription]);

  return { checkSubscriptionStatus: debouncedCheckSubscription };
};
