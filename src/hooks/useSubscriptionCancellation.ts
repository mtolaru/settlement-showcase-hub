
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
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const openStripePortal = (url: string) => {
    // Open the portal URL in a new tab
    window.open(url, '_blank');
    
    // Close the dialog
    setShowCancelDialog(false);
    
    // Clear any errors
    setCancelError(null);
  };

  const handleCancelSubscription = async () => {
    if (!subscription || isCancelling) return;

    setIsCancelling(true);
    setCancelError(null);
    setPortalUrl(null); // Reset the portal URL

    try {
      // Request Stripe Customer Portal URL via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-customer-portal', {
        body: { 
          subscription_id: subscription.id,
          return_url: window.location.origin + '/manage'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.url) {
        // Set the portal URL - this triggers the button to change
        setPortalUrl(data.url);
        console.log("Portal URL generated:", data.url);
      } else {
        throw new Error('No portal URL returned from Stripe');
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
    portalUrl,
    setShowCancelDialog,
    setCancelError,
    handleCancelSubscription,
    openStripePortal
  };
};
