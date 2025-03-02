
import { format } from "date-fns";
import { CreditCard, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface Subscription {
  id: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  payment_id?: string | null;
  temporary_id?: string | null;
  cancel_at_period_end?: boolean;
}

interface SubscriptionStatusProps {
  subscription: Subscription | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

const SubscriptionStatus = ({ subscription, isLoading, onRefresh }: SubscriptionStatusProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  const handleManualSync = () => {
    if (onRefresh) {
      toast({
        title: "Syncing subscription status",
        description: "Checking for recent subscription changes...",
      });
      onRefresh();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading subscription details...</span>
      </div>
    );
  }

  if (!subscription?.is_active) {
    return (
      <div className="space-y-4">
        <p className="text-neutral-600">
          You currently don't have an active subscription. Subscribe to unlock unlimited settlement submissions and more features.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => navigate('/pricing')}>
            Subscribe Now
          </Button>
          <Button 
            variant="outline" 
            onClick={handleManualSync}
          >
            Sync Subscription Status
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`flex items-start gap-4 p-4 rounded-lg ${subscription.cancel_at_period_end ? 'bg-amber-50' : 'bg-primary-50'}`}>
        <div className={`rounded-full p-3 ${subscription.cancel_at_period_end ? 'bg-amber-100' : 'bg-primary-100'}`}>
          {subscription.cancel_at_period_end ? (
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          ) : (
            <CreditCard className="h-6 w-6 text-primary-600" />
          )}
        </div>
        <div>
          {subscription.cancel_at_period_end ? (
            <>
              <h3 className="font-semibold text-amber-900">Subscription Canceling</h3>
              <p className="text-amber-700 mt-1">
                Your subscription will remain active until {subscription.ends_at ? formatDate(subscription.ends_at) : 'the end of your billing period'}.
              </p>
              <div className="mt-4">
                <Button 
                  onClick={() => navigate('/pricing')}
                  variant="outline"
                  className="border-amber-500 text-amber-700 hover:bg-amber-50"
                >
                  Resubscribe
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-primary-900">Active Subscription</h3>
              <p className="text-primary-700 mt-1">
                Your subscription is active {subscription.ends_at ? `until ${formatDate(subscription.ends_at)}` : '(ongoing)'}
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
            </>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="font-medium mb-2">Subscription Details</h4>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-neutral-600">Started on</dt>
            <dd className="font-medium">{formatDate(subscription.starts_at)}</dd>
          </div>
          {subscription.ends_at && (
            <div>
              <dt className="text-neutral-600">{subscription.cancel_at_period_end ? 'Cancels on' : 'Expires on'}</dt>
              <dd className="font-medium">{formatDate(subscription.ends_at)}</dd>
            </div>
          )}
          {subscription.payment_id && (
            <div>
              <dt className="text-neutral-600">Payment ID</dt>
              <dd className="font-medium">{subscription.payment_id}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
