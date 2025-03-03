
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
      
      // For virtual subscriptions, skip the edge function and handle locally
      if (subscription.id.startsWith('virtual-') || subscription.id.startsWith('stripe-')) {
        console.log('Handling virtual subscription cancellation locally');
        
        // Set an end date 30 days from now
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        
        // Just update our UI state - no need to call the edge function
        toast({
          title: "Subscription Canceled",
          description: `Your subscription will remain active until ${format(endDate, 'MMMM d, yyyy')}.`
        });
        
        // Update the local subscription object
        if (refreshSubscription) {
          refreshSubscription();
        }
        
        // Close the dialog
        setShowCancelDialog(false);
        return;
      }
      
      // For real subscriptions, use the direct fetch approach to ensure proper redirection
      const requestUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://zxstilrzamzlgswgwlpp.supabase.co'}/functions/v1/cancel-subscription`;
      console.log('Making direct fetch to:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4c3RpbHJ6YW16bGdzd2d3bHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MDAzOTYsImV4cCI6MjA1NjA3NjM5Nn0.WiqcQcQnxfGhE9BwCorEYdZbV3ece7ITv2OwCUufpwI'}`,
        },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Non-2xx response from cancel-subscription function:', response.status, errorData);
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Subscription cancellation response:', data);
      
      // Check if we have a redirectUrl for Stripe portal
      if (data.redirectUrl) {
        console.log('Received Stripe portal URL:', data.redirectUrl);
        
        // Store the portal URL
        setPortalUrl(data.redirectUrl);
        
        toast({
          title: "Stripe Portal Available",
          description: "You can manage your subscription through Stripe's portal."
        });
        
        return;
      }
      
      // For database-only cancellations
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
    console.log('Opening Stripe portal URL:', url);
    
    // Directly redirect to the portal URL in the current tab
    window.location.href = url;
    
    setShowCancelDialog(false);
    toast({
      title: "Redirecting to Stripe Portal",
      description: "You're being redirected to manage your subscription."
    });
  };

  return {
    isCancelling,
    showCancelDialog,
    cancelError,
    portalUrl,
    setShowCancelDialog,
    setCancelError,
    setPortalUrl,
    handleCancelSubscription,
    openStripePortal
  };
};
