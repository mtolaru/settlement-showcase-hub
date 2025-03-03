
import { format } from "date-fns";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Subscription } from "@/hooks/useSubscription";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubscriptionStatusProps {
  subscription: Subscription | null;
  isLoading: boolean;
  refreshSubscription?: () => void;
}

const SubscriptionStatus = ({ 
  subscription, 
  isLoading,
  refreshSubscription 
}: SubscriptionStatusProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

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
        
        toast({
          title: "Stripe Portal Ready",
          description: "Click the button to manage your subscription in the Stripe Customer Portal."
        });
        
        // Don't close the dialog - we want the user to click the button
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
    window.open(url, '_blank');
    setShowCancelDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading subscription details...</span>
      </div>
    );
  }

  // Check for virtual subscription or regular subscription with is_active=true
  const isSubscriptionActive = subscription && 
    (subscription.is_active || 
     subscription.id.startsWith('virtual-') || 
     subscription.id.startsWith('stripe-'));

  if (!isSubscriptionActive) {
    return (
      <div className="space-y-4">
        <p className="text-neutral-600">
          You currently don't have an active subscription. Subscribe to unlock unlimited settlement submissions and more features.
        </p>
        <Button onClick={() => navigate('/pricing')}>
          Subscribe Now
        </Button>
      </div>
    );
  }

  // Check if subscription is already canceled but still active
  const isCanceled = subscription?.ends_at && new Date(subscription.ends_at) > new Date();

  // User has an active subscription
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
        <div className="rounded-full bg-primary-100 p-3">
          <CreditCard className="h-6 w-6 text-primary-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-primary-900">
            {isCanceled ? 'Subscription Ending Soon' : 'Active Subscription'}
          </h3>
          <p className="text-primary-700 mt-1">
            {isCanceled 
              ? `Your subscription will end on ${formatDate(subscription.ends_at!)}`
              : subscription.ends_at 
                ? `Your subscription is active until ${formatDate(subscription.ends_at)}` 
                : 'Your subscription is active (ongoing)'}
          </p>
          <ul className="mt-4 space-y-2 text-primary-700">
            <li className="flex items-center gap-2">
              ✓ Unlimited settlement submissions
            </li>
            <li className="flex items-center gap-2">
              ✓ Access to detailed analytics
            </li>
            <li className="flex items-center gap-2">
              ✓ Priority support
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">Subscription Details</h4>
          {!isCanceled && (
            <Button 
              variant="outline" 
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => setShowCancelDialog(true)}
              disabled={isCancelling}
            >
              {isCancelling ? "Processing..." : "Manage Subscription"}
            </Button>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-neutral-600">Started on</dt>
            <dd className="font-medium">{formatDate(subscription.starts_at)}</dd>
          </div>
          {subscription.ends_at && (
            <div>
              <dt className="text-neutral-600">{isCanceled ? 'Ends on' : 'Expires on'}</dt>
              <dd className="font-medium">{formatDate(subscription.ends_at)}</dd>
            </div>
          )}
          {subscription.payment_id && (
            <div>
              <dt className="text-neutral-600">Payment ID</dt>
              <dd className="font-medium">{subscription.payment_id}</dd>
            </div>
          )}
          {subscription.customer_id && (
            <div>
              <dt className="text-neutral-600">Customer ID</dt>
              <dd className="font-medium">{subscription.customer_id}</dd>
            </div>
          )}
        </dl>
      </div>

      <AlertDialog 
        open={showCancelDialog} 
        onOpenChange={(open) => {
          setShowCancelDialog(open);
          if (!open) {
            setCancelError(null);
            setPortalUrl(null);
          }
        }}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {portalUrl ? "Manage Your Subscription" : "Manage or Cancel Subscription"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {portalUrl ? (
                <div className="space-y-4">
                  <p>
                    Click the button below to access the Stripe Customer Portal where you can:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Update payment methods</li>
                    <li>View billing history</li>
                    <li>Cancel your subscription</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p>
                    You'll be redirected to Stripe's secure customer portal where you can manage or cancel your subscription.
                  </p>
                  <p className="mt-2">
                    If you cancel, your subscription will remain active until the end of your current billing period. 
                    After that, your settlements will be delisted from search results.
                  </p>
                </div>
              )}
              
              {cancelError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
                  {cancelError}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Close
            </AlertDialogCancel>
            
            {portalUrl ? (
              <Button 
                onClick={() => openStripePortal(portalUrl)}
                className="gap-2"
              >
                Open Stripe Portal <ExternalLink className="h-4 w-4" />
              </Button>
            ) : (
              <AlertDialogAction 
                onClick={handleCancelSubscription}
                className="bg-primary-500 hover:bg-primary-600"
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue to Stripe"
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubscriptionStatus;
