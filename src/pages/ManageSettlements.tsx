
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useSettlements } from "@/hooks/useSettlements";
import AccountHeader from "@/components/manage/AccountHeader";
import SubscriptionSection from "@/components/manage/SubscriptionSection";
import SettlementsSection from "@/components/manage/SettlementsSection";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const ManageSettlements = () => {
  const { checkAuth, signOut, user } = useAuth();
  const { subscription, isLoading: isLoadingSubscription, isVerified, refreshSubscription } = useSubscription(user);
  const { settlements, isLoading: isLoadingSettlements, refreshSettlements } = useSettlements(user);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSettlements();
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container max-w-4xl">
        <AccountHeader user={user} signOut={signOut} />

        <SubscriptionSection 
          subscription={subscription} 
          isLoading={isLoadingSubscription}
          isVerified={isVerified}
          refreshSubscription={refreshSubscription}
        />

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">My Settlements</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingSettlements}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <SettlementsSection 
          settlements={settlements} 
          isLoading={isLoadingSettlements || isRefreshing}
          refreshSettlements={refreshSettlements}
          userId={user?.id}
        />
      </div>
    </div>
  );
};

export default ManageSettlements;
