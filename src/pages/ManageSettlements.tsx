
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Settlement } from "@/types/settlement";
import { useAuth } from "@/hooks/useAuth";
import SubscriptionStatus from "@/components/manage/SubscriptionStatus";
import SettlementsList from "@/components/manage/SettlementsList";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface Subscription {
  id: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
}

const ManageSettlements = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { checkAuth, signOut, user } = useAuth();

  useEffect(() => {
    fetchSubscriptionStatus();
    fetchSettlements();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // First try to get subscription without end date (ongoing subscription)
        let { data: subscriptionData, error: error1 } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .is('ends_at', null)
          .maybeSingle();

        // If no ongoing subscription found, look for active subscription with future end date
        if (!subscriptionData && !error1) {
          const { data: timedSubscription, error: error2 } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .gt('ends_at', new Date().toISOString())
            .maybeSingle();

          if (error2) {
            console.error('Failed to fetch timed subscription:', error2);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to fetch subscription status.",
            });
            return;
          }
          subscriptionData = timedSubscription;
        } else if (error1) {
          console.error('Failed to fetch ongoing subscription:', error1);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch subscription status.",
          });
          return;
        }

        console.log('Subscription data:', subscriptionData); // Debug log
        setSubscription(subscriptionData);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    }
  };

  const fetchSettlements = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data, error } = await supabase
          .from('settlements')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSettlements(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold font-display text-primary-900">
            My Account
          </h1>
          <Button 
            variant="outline" 
            onClick={signOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {user && (
          <div className="bg-primary-50 rounded-lg p-4 mb-8">
            <p className="text-primary-700">
              Signed in as <span className="font-semibold">{user.email}</span>
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Subscription Status</h2>
          <SubscriptionStatus 
            subscription={subscription} 
            isLoading={isLoading} 
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">My Settlements</h2>
          <SettlementsList 
            settlements={settlements} 
            isLoading={isLoading} 
          />
        </div>
      </div>
    </div>
  );
};

export default ManageSettlements;
