
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import { Subscription } from "@/hooks/useSubscription";
interface SubscriptionCardProps {
  subscription: Subscription;
  isCanceled: boolean;
  isVerified?: boolean;
}
const SubscriptionCard = ({
  subscription,
  isCanceled,
  isVerified
}: SubscriptionCardProps) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  // Debug subscription data
  console.log("SubscriptionCard rendering with:", {
    subscription,
    isCanceled,
    subscription_status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end
  });
  return <div className={`flex items-start gap-4 p-4 ${isCanceled ? 'bg-neutral-50 border border-neutral-200' : 'bg-primary-50 border border-primary-100'} rounded-lg shadow-sm`}>
      <div className={`rounded-full ${isCanceled ? 'bg-neutral-100' : 'bg-primary-100'} p-3`}>
        <CreditCard className={`h-6 w-6 ${isCanceled ? 'text-neutral-600' : 'text-primary-600'}`} />
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold ${isCanceled ? 'text-neutral-900' : 'text-primary-900'}`}>
          {isCanceled ? 'Subscription Canceled' : 'Active Subscription'}
        </h3>
        <p className={`${isCanceled ? 'text-neutral-700' : 'text-primary-700'} mt-1`}>
          {isCanceled ? `Your subscription will end on ${formatDate(subscription.ends_at!)}. After this date, your settlements will be delisted.` : subscription.ends_at ? `Your subscription is active until ${formatDate(subscription.ends_at)}` : 'Your subscription is active and will renew automatically'}
        </p>
        {isCanceled && <div className="mt-2 text-neutral-800 font-medium">
            You can reactivate your subscription before the end date to maintain access to your settlements.
          </div>}
        <ul className={`mt-4 space-y-2 ${isCanceled ? 'text-neutral-700' : 'text-primary-700'}`}>
          <li className="flex items-center gap-2">
            ✓ Unlimited settlement submissions
          </li>
          <li className="flex items-center gap-2">✓ Transform your Settlements into content</li>
          <li className="flex items-center gap-2"></li>
        </ul>
      </div>
    </div>;
};
export default SubscriptionCard;
