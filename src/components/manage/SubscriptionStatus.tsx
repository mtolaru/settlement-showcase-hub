
import { Subscription } from "@/hooks/useSubscription";
import { useSubscriptionCancellation } from "@/hooks/useSubscriptionCancellation";
import SubscriptionStatusLoading from "./subscription/SubscriptionStatusLoading";
import NoActiveSubscription from "./subscription/NoActiveSubscription";
import SubscriptionCard from "./subscription/SubscriptionCard";
import SubscriptionDetails from "./subscription/SubscriptionDetails";
import CancelSubscriptionDialog from "./subscription/CancelSubscriptionDialog";

interface SubscriptionStatusProps {
  subscription: Subscription | null;
  isLoading: boolean;
  isVerified?: boolean;
  refreshSubscription?: () => void;
}

const SubscriptionStatus = ({ 
  subscription, 
  isLoading,
  isVerified,
  refreshSubscription 
}: SubscriptionStatusProps) => {
  const {
    isCancelling,
    showCancelDialog,
    cancelError,
    setShowCancelDialog,
    setCancelError,
    handleCancelSubscription
  } = useSubscriptionCancellation(subscription, refreshSubscription);

  if (isLoading) {
    return <SubscriptionStatusLoading />;
  }

  // Check for virtual subscription or regular subscription with is_active=true
  const isSubscriptionActive = subscription && 
    (subscription.is_active || 
     subscription.id.startsWith('virtual-') || 
     subscription.id.startsWith('stripe-'));

  if (!isSubscriptionActive) {
    return <NoActiveSubscription />;
  }

  // Log subscription data for debugging
  console.log("Subscription status data:", {
    subscription,
    explicit_status: subscription?.status,
    cancel_at_period_end: subscription?.cancel_at_period_end,
    ends_at: subscription?.ends_at
  });

  // Determine if subscription is canceled but still active (ends_at is in the future)
  const hasEndDate = subscription?.ends_at && new Date(subscription.ends_at) > new Date();
  
  // Check if the subscription explicitly has a canceled status
  const isExplicitlyCanceled = subscription?.status === 'canceled' || 
                               subscription?.cancel_at_period_end === true;
  
  // Use either explicit cancellation or ends_at to determine if subscription is canceled
  const isSubscriptionCanceled = hasEndDate || isExplicitlyCanceled;

  console.log("Is subscription canceled:", isSubscriptionCanceled, {
    hasEndDate,
    isExplicitlyCanceled
  });

  // Handle dialog close
  const handleDialogOpenChange = (open: boolean) => {
    setShowCancelDialog(open);
    if (!open) {
      setCancelError(null);
    }
  };

  // Check if the subscription is managed by Stripe
  const isStripeManaged = !!subscription?.id.startsWith('stripe-') || 
    !!(subscription?.customer_id && subscription?.payment_id);

  // Direct action for SubscriptionDetails "Manage Subscription" button
  const handleManageSubscriptionClick = () => {
    if (isStripeManaged) {
      // If it's a Stripe-managed subscription, show dialog first
      setShowCancelDialog(true);
    } else {
      // For other subscriptions, you might want to handle differently
      setShowCancelDialog(true);
    }
  };

  return (
    <div className="space-y-6">
      <SubscriptionCard 
        subscription={subscription} 
        isCanceled={isSubscriptionCanceled}
        isVerified={!!isVerified}
      />

      <SubscriptionDetails 
        subscription={subscription}
        isCanceled={isSubscriptionCanceled}
        isCancelling={isCancelling}
        isStripeManaged={isStripeManaged}
        onCancelClick={handleManageSubscriptionClick}
      />

      <CancelSubscriptionDialog 
        isOpen={showCancelDialog}
        isCancelling={isCancelling}
        cancelError={cancelError}
        isStripeManaged={isStripeManaged}
        isCanceled={isSubscriptionCanceled}
        onCancel={() => setShowCancelDialog(false)}
        onConfirm={handleCancelSubscription}
        onOpenChange={handleDialogOpenChange}
      />
    </div>
  );
};

export default SubscriptionStatus;
