
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
  refreshSubscription?: () => void;
}

const SubscriptionStatus = ({ 
  subscription, 
  isLoading,
  refreshSubscription 
}: SubscriptionStatusProps) => {
  const {
    isCancelling,
    showCancelDialog,
    cancelError,
    portalUrl,
    setShowCancelDialog,
    setCancelError,
    handleCancelSubscription,
    openStripePortal
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

  return (
    <div className="space-y-6">
      <SubscriptionCard 
        subscription={subscription} 
        isCanceled={isCanceled} 
      />

      <SubscriptionDetails 
        subscription={subscription}
        isCanceled={isCanceled}
        isCancelling={isCancelling}
        onCancelClick={() => setShowCancelDialog(true)}
      />

      <CancelSubscriptionDialog 
        isOpen={showCancelDialog}
        isCancelling={isCancelling}
        cancelError={cancelError}
        portalUrl={portalUrl}
        onCancel={() => setShowCancelDialog(false)}
        onConfirm={handleCancelSubscription}
        onOpenChange={handleDialogOpenChange}
        onOpenPortal={openStripePortal}
      />
    </div>
  );
};

export default SubscriptionStatus;
