
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { Settlement } from "@/types/settlement";
import { Card, CardContent } from "@/components/ui/card";

interface SettlementsListProps {
  settlements: Settlement[];
  isLoading: boolean;
}

const SettlementsList = ({ settlements, isLoading }: SettlementsListProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date";
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return "Unknown date";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSettlementClick = (settlementId: number) => {
    navigate(`/settlements/${settlementId}`);
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
        <Card 
          key={settlement.id} 
          className="border hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleSettlementClick(settlement.id)}
        >
          <CardContent className="p-4">
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
                  {formatDate(settlement.settlement_date || settlement.created_at)}
                </div>
              </div>
            </div>
            {settlement.description && (
              <p className="mt-2 text-neutral-600 line-clamp-2">{settlement.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SettlementsList;
