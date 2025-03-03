
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Subscription } from "@/hooks/useSubscription";

interface SubscriptionDetailsProps {
  subscription: Subscription;
  isCanceled: boolean;
  isCancelling: boolean;
  isStripeManaged?: boolean;
  onCancelClick: () => void;
}

const SubscriptionDetails = ({ 
  subscription, 
  isCanceled, 
  isCancelling, 
  isStripeManaged = false,
  onCancelClick 
}: SubscriptionDetailsProps) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  return (
    <div className="border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">Subscription Details</h4>
        {!isCanceled && (
          <Button 
            variant="outline" 
            className="text-red-600 border-red-300 hover:bg-red-50"
            onClick={onCancelClick}
            disabled={isCancelling}
          >
            {isCancelling ? "Processing..." : isStripeManaged ? "Manage Subscription" : "Cancel Subscription"}
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
        {isStripeManaged && (
          <div className="col-span-2 mt-2">
            <p className="text-sm text-primary-700">
              This subscription is managed through Stripe. You'll be redirected to the Stripe portal to manage your subscription.
            </p>
          </div>
        )}
      </dl>
    </div>
  );
};

export default SubscriptionDetails;
