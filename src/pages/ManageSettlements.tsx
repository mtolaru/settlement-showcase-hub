
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Settlement } from "@/types/settlement";
import { useAuth } from "@/hooks/useAuth";
import SubscriptionStatus from "@/components/manage/SubscriptionStatus";
import SettlementsList from "@/components/manage/SettlementsList";

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
  const { checkAuth } = useAuth();

  useEffect(() => {
    fetchSubscriptionStatus();
    fetchSettlements();
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch settlements.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-bold font-display text-primary-900 mb-6">
          Manage Account
        </h1>

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
