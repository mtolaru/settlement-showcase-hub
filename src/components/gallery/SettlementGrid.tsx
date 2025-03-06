
import type { Settlement } from "@/types/settlement";
import SettlementGridItem from "./SettlementGridItem";

interface SettlementGridProps {
  settlements: Settlement[];
}

const SettlementGrid = ({ settlements }: SettlementGridProps) => {
  const handleCardClick = (id: number) => {
    window.location.href = `/settlements/${id}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {settlements.map((settlement, index) => (
        <SettlementGridItem 
          key={settlement.id} 
          settlement={settlement}
          index={index} 
          onCardClick={handleCardClick}
        />
      ))}
    </div>
  );
};

export default SettlementGrid;
