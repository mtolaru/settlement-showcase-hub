
import React from "react";
import { Building2 } from "lucide-react";
import { ShareButton } from "@/components/sharing/ShareButton";

interface SettlementDetailsProps {
  id: number;
  amount: number;
  type: string;
  attorney: string;
  firm: string;
  firmWebsite?: string;
  location: string;
  settlementDate: string | null;
  createdAt: string;
  caseDescription?: string;
  formatAmount: (amount: number) => string;
  formatDate: (dateString: string | null) => string;
}

const SettlementDetails = ({
  id,
  amount,
  type,
  attorney,
  firm,
  firmWebsite,
  location,
  settlementDate,
  createdAt,
  caseDescription,
  formatAmount,
  formatDate
}: SettlementDetailsProps) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-3xl font-bold text-primary-500">
            {formatAmount(amount)}
          </span>
          <p className="text-sm text-neutral-600 mt-1">
            {type}
          </p>
        </div>
        
        <div onClick={(e) => e.stopPropagation()}>
          <ShareButton
            url={`${window.location.origin}/settlements/${id}`}
            title={`${formatAmount(amount)} Settlement - ${type}`}
            amount={amount.toString()}
            caseType={type}
            variant="icon"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-bold text-lg text-neutral-900">
          {attorney}
        </h3>
        <p className="text-sm text-neutral-600">
          {firmWebsite ? (
            <a
              href={firmWebsite.startsWith('http') ? firmWebsite : `https://${firmWebsite}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                window.open(firmWebsite?.startsWith('http') ? firmWebsite : `https://${firmWebsite}`, '_blank');
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
          Settlement Date: {formatDate(settlementDate) || formatDate(createdAt)}
        </p>
        {caseDescription && (
          <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
            {caseDescription}
          </p>
        )}
      </div>
    </div>
  );
};

export default SettlementDetails;
