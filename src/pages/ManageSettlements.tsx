
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
    const initializeData = async () => {
      const session = await checkAuth();
      if (session) {
        await Promise.all([
          fetchSubscriptionStatus(session.user.id),
          fetchSettlements(session.user.id)
        ]);
      }
    };

    initializeData();
  }, [checkAuth]);

  const fetchSubscriptionStatus = async (userId: string) => {
    try {
      console.log('Fetching subscription for user:', userId);
      
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('id, starts_at, ends_at, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Subscription fetch error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch subscription status. Please try again.",
        });
        return;
      }

      console.log('Subscription data:', subscriptionData);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Subscription fetch exception:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while fetching subscription data.",
      });
    }
  };

  const fetchSettlements = async (userId: string) => {
    try {
      console.log('Fetching settlements for user:', userId);
      
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Settlements fetch error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch settlements. Please try again.",
        });
        return;
      }

      console.log('Settlements data:', data);
      setSettlements(data || []);
    } catch (error) {
      console.error('Settlements fetch exception:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while fetching settlements.",
      });
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
