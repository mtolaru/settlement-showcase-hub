
import React from "react";
import { Subscription } from "@/hooks/useSubscription";
import SubscriptionStatus from "@/components/manage/SubscriptionStatus";

interface SubscriptionSectionProps {
  subscription: Subscription | null;
  isLoading: boolean;
}

const SubscriptionSection = ({ 
  subscription, 
  isLoading
}: SubscriptionSectionProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Subscription Status</h2>
      </div>
      
      <SubscriptionStatus 
        subscription={subscription} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default SubscriptionSection;
