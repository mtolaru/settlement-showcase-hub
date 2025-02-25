
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface Subscription {
  id: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
}

const ManageSettlements = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .gt('ends_at', new Date().toISOString())
          .maybeSingle();

        if (error) throw error;
        setSubscription(subscriptionData);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch subscription status.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-bold font-display text-primary-900 mb-6">
          Manage Account
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Subscription Status</h2>
          
          {isLoading ? (
            <div className="flex items-center gap-2 text-neutral-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading subscription details...</span>
            </div>
          ) : subscription ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
                <div className="rounded-full bg-primary-100 p-3">
                  <CreditCard className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900">Active Subscription</h3>
                  <p className="text-primary-700 mt-1">
                    Your subscription is active until {subscription.ends_at ? formatDate(subscription.ends_at) : 'ongoing'}
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
                </dl>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-neutral-600">
                You currently don't have an active subscription. Subscribe to unlock unlimited settlement submissions and more features.
              </p>
              <Button>
                Subscribe Now
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">My Settlements</h2>
          <p className="text-neutral-600">
            Coming soon: View and manage all your submitted settlements in one place.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManageSettlements;
