
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { Settlement } from "@/types/settlement";

interface SettlementsListProps {
  settlements: Settlement[];
  isLoading: boolean;
}

const SettlementsList = ({ settlements, isLoading }: SettlementsListProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading settlements...</span>
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-neutral-600">
          You haven't submitted any settlements yet.
        </p>
        <Button onClick={() => navigate('/submit')}>
          Submit Your First Settlement
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {settlements.map((settlement) => (
        <div key={settlement.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{settlement.type}</h3>
              <p className="text-neutral-600">{settlement.firm}</p>
            </div>
            <div className="text-right">
              <div className="font-semibold text-lg text-primary-600">
                {formatCurrency(settlement.amount)}
              </div>
              <div className="text-sm text-neutral-500">
                {formatDate(settlement.created_at)}
              </div>
            </div>
          </div>
          {settlement.description && (
            <p className="mt-2 text-neutral-600">{settlement.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default SettlementsList;
