
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useSettlements } from "@/hooks/useSettlements";
import AccountHeader from "@/components/manage/AccountHeader";
import SubscriptionSection from "@/components/manage/SubscriptionSection";
import SettlementsSection from "@/components/manage/SettlementsSection";

const ManageSettlements = () => {
  const { checkAuth, signOut, user } = useAuth();
  const { subscription, isLoading: isLoadingSubscription, isVerified, refreshSubscription } = useSubscription(user);
  const { settlements, isLoading: isLoadingSettlements, refreshSettlements } = useSettlements(user);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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

        <SettlementsSection 
          settlements={settlements} 
          isLoading={isLoadingSettlements}
          refreshSettlements={refreshSettlements}
          userId={user?.id}
        />
      </div>
    </div>
  );
};

export default ManageSettlements;
