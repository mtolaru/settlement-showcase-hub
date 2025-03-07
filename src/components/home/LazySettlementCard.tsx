
import { lazy, Suspense } from "react";
import { Card } from "@/components/ui/card";

// Define the Settlement interface
interface Settlement {
  id: number;
  type: string;
  amount: string;
  lawyer: string;
  firm: string;
  firmWebsite?: string;
  location: string;
  date: string; 
  settlementDate?: string;
  photo_url?: string;
}

interface SettlementCardProps {
  settlement: Settlement;
}

// Create a simple placeholder while the real card loads
const SettlementCardPlaceholder = () => (
  <Card className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
    <div className="h-48 bg-neutral-100 animate-pulse"></div>
    <div className="p-6">
      <div className="space-y-4">
        <div className="h-8 w-3/4 bg-neutral-100 animate-pulse rounded"></div>
        <div className="h-4 w-1/2 bg-neutral-100 animate-pulse rounded"></div>
        <div className="h-4 w-3/4 bg-neutral-100 animate-pulse rounded"></div>
        <div className="h-4 w-1/2 bg-neutral-100 animate-pulse rounded"></div>
      </div>
    </div>
  </Card>
);

// Lazy load the actual SettlementCard component
const SettlementCardComponent = lazy(() => import("./SettlementCard"));

// Wrapper component with Suspense for lazy loading
const LazySettlementCard = ({ settlement }: SettlementCardProps) => {
  return (
    <Suspense fallback={<SettlementCardPlaceholder />}>
      <SettlementCardComponent settlement={settlement} />
    </Suspense>
  );
};

export default LazySettlementCard;
