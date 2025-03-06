
import React from "react";

interface ImageTagsProps {
  type: string;
  settlementPhase: string | null;
  getSettlementPhaseLabel: (phase: string | null) => string;
}

const ImageTags: React.FC<ImageTagsProps> = ({ 
  type, 
  settlementPhase, 
  getSettlementPhaseLabel 
}) => {
  return (
    <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
      <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-neutral-900">
        {type}
      </span>
      {settlementPhase && (
        <span className="bg-primary-100 px-3 py-1 rounded-full text-sm font-medium text-primary-800">
          {getSettlementPhaseLabel(settlementPhase)}
        </span>
      )}
    </div>
  );
};

export default ImageTags;
