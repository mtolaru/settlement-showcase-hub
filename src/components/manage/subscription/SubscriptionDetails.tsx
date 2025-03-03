
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Subscription } from "@/hooks/useSubscription";
import { ExternalLink } from "lucide-react";

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

  return (
    <div className="border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">Subscription Details</h4>
        {!isCanceled && (
          <Button 
            variant="outline" 
            className="text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-2"
            onClick={onCancelClick}
            disabled={isCancelling}
          >
            {isCancelling ? "Processing..." : (
              <>Manage Subscription <ExternalLink className="h-4 w-4" /></>
            )}
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
      </dl>
    </div>
  );
};

export default SubscriptionDetails;
