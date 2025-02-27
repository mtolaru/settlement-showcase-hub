import { format } from "date-fns";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Subscription {
  id: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  payment_id?: string | null;
}

interface SubscriptionStatusProps {
  subscription: Subscription | null;
  isLoading: boolean;
}

const SubscriptionStatus = ({ subscription: propSubscription, isLoading: propIsLoading }: SubscriptionStatusProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(propSubscription);
  const [isLoading, setIsLoading] = useState(propIsLoading);

  useEffect(() => {
    if (propSubscription) {
      setSubscription(propSubscription);
      return;
    }

    const fetchSubscription = async () => {
      if (!user) return;

      try {
        console.log("Explicitly fetching subscription for user:", user.id);
        
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('starts_at', { ascending: false })
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching subscription:", error);
          return;
        }
        
        if (data) {
          console.log("Found subscription by user_id:", data);
          setSubscription(data);
          return;
        }
        
        if (user.user_metadata?.temporaryId) {
          const { data: tempData, error: tempError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('temporary_id', user.user_metadata.temporaryId)
            .eq('is_active', true)
            .maybeSingle();
            
          if (tempError) {
            console.error("Error fetching subscription by temporary_id:", tempError);
            return;
          }
          
          if (tempData) {
            console.log("Found subscription by temporary_id:", tempData);
            setSubscription(tempData);
            
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({ user_id: user.id })
              .eq('id', tempData.id);
              
            if (updateError) {
              console.error("Error updating subscription user_id:", updateError);
            } else {
              console.log("Updated subscription with user_id");
            }
          }
        }
      } catch (e) {
        console.error("Error in fetchSubscription:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [propSubscription, user]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
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
        <Button onClick={() => navigate('/pricing')}>
          Subscribe Now
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
        <div className="rounded-full bg-primary-100 p-3">
          <CreditCard className="h-6 w-6 text-primary-600" />
        </div>
        <div>
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
              <dt className="text-neutral-600">Expires on</dt>
              <dd className="font-medium">{formatDate(subscription.ends_at)}</dd>
            </div>
          )}
          {subscription.payment_id && (
            <div>
              <dt className="text-neutral-600">Payment ID</dt>
              <dd className="font-medium truncate text-xs">{subscription.payment_id}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
