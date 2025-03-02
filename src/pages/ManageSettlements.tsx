
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useSettlements } from "@/hooks/useSettlements";
import AccountHeader from "@/components/manage/AccountHeader";
import SubscriptionSection from "@/components/manage/SubscriptionSection";
import SettlementsSection from "@/components/manage/SettlementsSection";

const ManageSettlements = () => {
  const { checkAuth, signOut, user } = useAuth();
  const { subscription, isLoading: isLoadingSubscription, refreshSubscription } = useSubscription(user);
  const { settlements, isLoading: isLoadingSettlements, refreshSettlements } = useSettlements(user);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleRefresh = () => {
    refreshSubscription();
    refreshSettlements();
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container max-w-4xl">
        <AccountHeader user={user} signOut={signOut} />

        <SubscriptionSection 
          subscription={subscription} 
          isLoading={isLoadingSubscription} 
          onRefresh={handleRefresh}
        />

        <SettlementsSection 
          settlements={settlements} 
          isLoading={isLoadingSettlements} 
        />
      </div>
    </div>
  );
};

export default ManageSettlements;
