
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
  payment_id: string | null;
}

const ManageSettlements = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { checkAuth, signOut, user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
      fetchSettlements();
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      if (!user) {
        console.log('No user found, skipping subscription fetch');
        return;
      }

      console.log('Fetching subscription for user:', user.id);
      
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('starts_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        throw error;
      }

      console.log('Found subscription:', subscriptionData);
      setSubscription(subscriptionData);
      
      if (!subscriptionData) {
        console.log('No active subscription found');
      } else {
        console.log('Active subscription details:', {
          id: subscriptionData.id,
          payment_id: subscriptionData.payment_id,
          is_active: subscriptionData.is_active,
          starts_at: subscriptionData.starts_at,
          ends_at: subscriptionData.ends_at
        });
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch subscription status. Please try again.",
      });
    }
  };

  const fetchSettlements = async () => {
    try {
      if (!user) {
        console.log('No user found, skipping settlements fetch');
        return;
      }

      console.log('Fetching settlements for user:', user.id);
      
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching settlements:', error);
        throw error;
      }
      
      console.log('Found settlements:', data);
      setSettlements(data || []);
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch settlements. Please try again.",
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
