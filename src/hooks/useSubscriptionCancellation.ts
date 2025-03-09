
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
      
      // Get current user's email
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email;
      
      console.log("Current user email for portal request:", userEmail);
      
      // Prepare customer ID or subscription ID to send to the edge function
      let customerId = subscription.customer_id;
      let stripeSubscriptionId = subscription.stripe_subscription_id;
      
      // Special case handling for known problematic customers
      if (userEmail === 'mtolaru+25@gmail.com') {
        console.log("Using hardcoded customer ID for known user");
        customerId = 'cus_Ruedmg7AMzsLAz';
      }
      
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
      
      console.log("Sending portal request with params:", {
        subscription_id: customerId || undefined,
        stripe_subscription_id: stripeSubscriptionId || undefined,
        user_email: userEmail
      });
      
      // Request Stripe Customer Portal URL via Supabase Edge Function
      const response = await supabase.functions.invoke('create-customer-portal', {
        body: { 
          subscription_id: customerId || undefined,
          stripe_subscription_id: stripeSubscriptionId || undefined,
          user_email: userEmail,
          return_url: window.location.origin + '/manage'
        }
      });

      console.log("Edge function response:", response);

      // Check for both data and error in response (since we're now always returning 200)
      const data = response.data;

      if (!data) {
        console.error("No data returned from edge function");
        throw new Error('No response received from server');
      }

      if (data.error) {
        console.error("Error returned from edge function:", data.error, data.details || '');
        
        if (data.redirectUrl) {
          console.log("Redirect URL provided, will redirect to:", data.redirectUrl);
          // Wait a moment to show error before redirecting
          setCancelError(data.error);
          setTimeout(() => {
            window.location.href = data.redirectUrl;
          }, 2000);
          return;
        }
        
        throw new Error(data.error || 'Error from server');
      }

      if (data.status === 'error') {
        console.error("Error status returned from edge function:", data);
        throw new Error(data.error || 'Error processing request');
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
      
      // Provide more user-friendly error messages
      let errorMessage = error.message || 'Failed to create customer portal session';
      
      // Check for specific error cases
      if (errorMessage.includes('No valid Stripe customer found')) {
        errorMessage = 'We could not find your Stripe customer record. Please contact support for assistance.';
      } else if (errorMessage.includes('non-2xx status code')) {
        errorMessage = 'The server encountered an issue processing your request. Please try again later.';
      }
      
      setCancelError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to access subscription management. Please try again or contact support.",
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
