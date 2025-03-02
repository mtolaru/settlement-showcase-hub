
import React from "react";
import { Subscription } from "@/hooks/useSubscription";
import SubscriptionStatus from "@/components/manage/SubscriptionStatus";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface SubscriptionSectionProps {
  subscription: Subscription | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const SubscriptionSection = ({ 
  subscription, 
  isLoading, 
  onRefresh 
}: SubscriptionSectionProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Subscription Status</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRefresh}
          className="flex items-center gap-1 text-neutral-600"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>
      
      <SubscriptionStatus 
        subscription={subscription} 
        isLoading={isLoading} 
        onRefresh={onRefresh}
      />
    </div>
  );
};

export default SubscriptionSection;
