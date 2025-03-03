
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import { Subscription } from "@/hooks/useSubscription";

interface SubscriptionCardProps {
  subscription: Subscription;
  isCanceled: boolean;
  isVerified?: boolean;
}

const SubscriptionCard = ({ subscription, isCanceled, isVerified }: SubscriptionCardProps) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  return (
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
              : 'Your subscription is active and will renew automatically'}
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
  );
};

export default SubscriptionCard;
