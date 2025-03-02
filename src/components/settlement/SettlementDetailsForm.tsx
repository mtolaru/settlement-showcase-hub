
import { useState } from "react";
import { DateInputField } from "./form-fields/DateInputField";
import { FinancialDetailsSection } from "./form-sections/FinancialDetailsSection";
import { CaseDetailsSection } from "./form-sections/CaseDetailsSection";

interface SettlementDetailsFormProps {
  formData: {
    amount: string;
    initialOffer: string;
    policyLimit: string;
    medicalExpenses: string;
    settlementPhase: string;
    caseType: string;
    otherCaseType: string;
    caseDescription: string;
    settlementDate: string;
  };
  errors: Record<string, string | undefined>;
  handleInputChange: (field: string, value: string) => void;
}

export const SettlementDetailsForm = ({
  formData,
  errors,
  handleInputChange,
}: SettlementDetailsFormProps) => {
  return (
    <div className="space-y-6">
      <FinancialDetailsSection 
        formData={formData}
        errors={errors}
        handleInputChange={handleInputChange}
      />

      <DateInputField
        label="Settlement Date*"
        value={formData.settlementDate}
        onChange={(value) => handleInputChange("settlementDate", value)}
        description="Enter the date when the settlement was finalized"
        error={errors.settlementDate}
      />

      <CaseDetailsSection 
        formData={formData}
        errors={errors}
        handleInputChange={handleInputChange}
      />
    </div>
  );
};
