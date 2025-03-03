
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
      
      // Prepare customer ID or subscription ID to send to the edge function
      let customerId = subscription.customer_id;
      
      // If no customer_id, try to use the subscription ID itself
      if (!customerId && subscription.id.startsWith('stripe-')) {
        // Extract the customer ID from the virtual subscription ID
        const match = subscription.id.match(/stripe-(.+)/);
        if (match && match[1]) {
          customerId = match[1];
        }
      }
      
      if (!customerId && !subscription.id.startsWith('virtual-')) {
        // For non-virtual subscriptions, use the subscription ID
        customerId = subscription.id;
      }
      
      if (!customerId) {
        console.error("No customer_id or valid subscription ID available:", subscription);
        throw new Error('No Stripe customer ID found for this subscription');
      }
      
      console.log("Using customer ID for portal request:", customerId);
      
      // Request Stripe Customer Portal URL via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-customer-portal', {
        body: { 
          subscription_id: customerId,
          return_url: window.location.origin + '/manage'
        }
      });

      if (error) {
        console.error("Error invoking edge function:", error);
        throw new Error(error.message || 'Error communicating with server');
      }

      if (!data) {
        console.error("No data returned from edge function");
        throw new Error('No response received from server');
      }

      if (data.error) {
        console.error("Error returned from edge function:", data.error);
        throw new Error(data.error || 'Error from server');
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
