import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Subscription } from "@/hooks/useSubscription";
import { format } from "date-fns";

export const useSubscriptionCancellation = (
  subscription: Subscription | null,
  refreshSubscription?: () => void
) => {
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    setIsCancelling(true);
    setCancelError(null);
    setPortalUrl(null);
    
    try {
      console.log('Attempting to cancel subscription:', subscription.id);
      console.log('Subscription details:', JSON.stringify(subscription));
      
      // Log the request details for troubleshooting
      const requestBody = { subscriptionId: subscription.id };
      console.log('Request payload:', requestBody);
      
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: requestBody
      });
      
      if (error) {
        console.error('Error calling cancel-subscription function:', error);
        setCancelError(`Error canceling subscription: ${error.message || 'Unknown error'}. Please try again later or contact support.`);
        toast({
          variant: "destructive",
          title: "Error canceling subscription",
          description: "Please try again later or contact support."
        });
        return;
      }
      
      console.log('Subscription cancellation response:', data);
      
      // Check if we have a redirectUrl for Stripe portal
      if (data.redirectUrl) {
        console.log('Received Stripe portal URL:', data.redirectUrl);
        setPortalUrl(data.redirectUrl);
        
        // Immediately open the portal URL in a new tab
        openStripePortal(data.redirectUrl);
        return;
      }
      
      // For virtual subscriptions or database-only cancellations
      toast({
        title: "Subscription Canceled",
        description: data.canceled_immediately 
          ? "Your subscription has been canceled immediately." 
          : `Your subscription will remain active until ${format(new Date(data.active_until), 'MMMM d, yyyy')}.`
      });
      
      // Refresh the subscription data
      if (refreshSubscription) {
        refreshSubscription();
      }
      
      // Close the dialog after successful cancellation
      setShowCancelDialog(false);
    } catch (err: any) {
      console.error('Exception canceling subscription:', err);
      setCancelError(`Error canceling subscription: ${err.message || 'Unknown error'}. Please try again later or contact support.`);
      toast({
        variant: "destructive",
        title: "Error canceling subscription",
        description: "Please try again later or contact support."
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const openStripePortal = (url: string) => {
    // Open in a new tab to ensure the portal loads properly
    console.log('Opening Stripe portal URL:', url);
    const newWindow = window.open(url, '_blank');
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.warn('Popup was blocked or failed to open');
      toast({
        variant: "destructive",
        title: "Popup Blocked",
        description: "Your browser blocked the popup. Please allow popups for this site and try again."
      });
      // Keep the dialog open so they can try again
      return;
    }
    
    setShowCancelDialog(false);
    toast({
      title: "Stripe Portal Opened",
      description: "You can now manage your subscription in the Stripe portal."
    });
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
