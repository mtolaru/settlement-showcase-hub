
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Subscription } from "./useSubscription";

export const useSubscriptionCancellation = (
  subscription: Subscription | null,
  refreshSubscription?: () => void
) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCancelSubscription = async () => {
    if (!subscription || isCancelling) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      console.log("Requesting Stripe Customer Portal for subscription:", subscription.id);
      
      // Directly handle button clicks on subscription details
      if (subscription.customer_id) {
        console.log("Customer ID found:", subscription.customer_id);
        
        // Request Stripe Customer Portal URL via Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('create-customer-portal', {
          body: { 
            subscription_id: subscription.id,
            return_url: window.location.origin + '/manage'
          }
        });

        if (error) {
          console.error("Error invoking edge function:", error);
          throw new Error(error.message);
        }

        if (data && data.url) {
          console.log("Portal URL generated, redirecting:", data.url);
          // Redirect to Stripe portal
          window.location.href = data.url;
          // Close the dialog if it's open
          setShowCancelDialog(false);
        } else {
          console.error("No portal URL returned:", data);
          throw new Error('No portal URL returned from Stripe');
        }
      } else {
        console.error("No customer_id available for subscription:", subscription);
        throw new Error('No Stripe customer ID found for this subscription');
      }
    } catch (error: any) {
      console.error('Error creating customer portal session:', error);
      setCancelError(error.message || 'Failed to create customer portal session');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to access subscription management. Please try again.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    isCancelling,
    showCancelDialog,
    cancelError,
    setShowCancelDialog,
    setCancelError,
    handleCancelSubscription
  };
};
