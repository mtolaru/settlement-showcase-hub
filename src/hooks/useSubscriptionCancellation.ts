
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

  const openStripePortal = async (url: string) => {
    window.open(url, '_blank');
    setShowCancelDialog(false);
  };

  const handleCancelSubscription = async () => {
    if (!subscription || isCancelling) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      // Always use Stripe Customer Portal for subscription management
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
        setPortalUrl(data.url);
        // Don't automatically redirect, let the user click the button in the dialog
      } else {
        throw new Error('No portal URL returned');
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
