
import { ShareButton } from "@/components/sharing/ShareButton";
import { Building2 } from "lucide-react";

interface SettlementCardDetailsProps {
  id: number;
  amount: string;
  type: string;
  lawyer: string;
  firm: string;
  firmWebsite?: string;
  location: string;
  settlementDate?: string;
  date: string;
  onClick: (e: React.MouseEvent) => void;
}

const SettlementCardDetails = ({
  id,
  amount,
  type,
  lawyer,
  firm,
  firmWebsite,
  location,
  settlementDate,
  date,
  onClick
}: SettlementCardDetailsProps) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-3xl font-bold text-primary-500">
            {amount}
          </span>
          <p className="text-sm text-neutral-600 mt-1">
            {type}
          </p>
        </div>
        <ShareButton 
          url={`${window.location.origin}/settlements/${id}`}
          title={`${amount} Settlement - ${type}`}
          amount={amount}
          caseType={type}
          variant="icon"
          className="mt-1"
        />
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-lg text-neutral-900">
          {lawyer}
        </h3>
        <p className="text-sm text-neutral-600">
          {firmWebsite ? (
            <a 
              href={firmWebsite}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                onClick(e);
              }}
              className="hover:text-primary-500 transition-colors"
            >
              {firm}
            </a>
          ) : (
            firm
          )}
        </p>
        <div className="flex items-center text-sm text-neutral-600">
          <Building2 className="h-4 w-4 mr-1" />
          {location}
        </div>
        <p className="text-sm text-neutral-600">
          Settlement Date: {settlementDate || date}
        </p>
      </div>
    </div>
  );
};

export default SettlementCardDetails;
