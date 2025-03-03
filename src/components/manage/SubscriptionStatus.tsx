
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

  // Check if subscription is already canceled but still active
  const isCanceled = subscription?.ends_at && new Date(subscription.ends_at) > new Date();

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
        isCanceled={isCanceled}
        isVerified={!!isVerified}
      />

      <SubscriptionDetails 
        subscription={subscription}
        isCanceled={isCanceled}
        isCancelling={isCancelling}
        isStripeManaged={isStripeManaged}
        onCancelClick={handleManageSubscriptionClick}
      />

      <CancelSubscriptionDialog 
        isOpen={showCancelDialog}
        isCancelling={isCancelling}
        cancelError={cancelError}
        isStripeManaged={isStripeManaged}
        onCancel={() => setShowCancelDialog(false)}
        onConfirm={handleCancelSubscription}
        onOpenChange={handleDialogOpenChange}
      />
    </div>
  );
};

export default SubscriptionStatus;
