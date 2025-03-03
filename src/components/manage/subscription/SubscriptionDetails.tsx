
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Subscription } from "@/hooks/useSubscription";
import { ExternalLink, RefreshCw } from "lucide-react";

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
  isStripeManaged,
  onCancelClick 
}: SubscriptionDetailsProps) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  // Debug for subscription details
  console.log("SubscriptionDetails rendering with:", { 
    subscription, 
    isCanceled, 
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    ends_at: subscription.ends_at
  });

  return (
    <div className="border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">Subscription Details</h4>
        <Button 
          variant="outline" 
          className="text-blue-600 border-blue-300 hover:bg-blue-50 flex items-center gap-2"
          onClick={onCancelClick}
          disabled={isCancelling}
        >
          {isCancelling ? "Processing..." : (
            <>Manage Subscription <ExternalLink className="h-4 w-4" /></>
          )}
        </Button>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-neutral-600">Started on</dt>
          <dd className="font-medium">{formatDate(subscription.starts_at)}</dd>
        </div>
        {subscription.ends_at && (
          <div>
            <dt className="text-neutral-600">{isCanceled ? 'Access ends on' : 'Expires on'}</dt>
            <dd className={`font-medium ${isCanceled ? 'text-amber-600' : ''}`}>{formatDate(subscription.ends_at)}</dd>
          </div>
        )}
        {isCanceled && (
          <div className="col-span-2 mt-2 bg-amber-50 p-3 rounded-md border border-amber-200">
            <p className="text-amber-800">
              <strong>Important:</strong> After {subscription.ends_at ? formatDate(subscription.ends_at) : 'your current billing period ends'}, your settlements will no longer be publicly visible. 
              Reactivate your subscription to maintain continuous access to your settlement data.
            </p>
          </div>
        )}
      </dl>
    </div>
  );
};

export default SubscriptionDetails;
