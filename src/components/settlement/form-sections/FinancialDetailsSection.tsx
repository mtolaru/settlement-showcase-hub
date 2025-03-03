
import { DollarInputField } from "../form-fields/DollarInputField";
import { useEffect } from "react";

interface FinancialDetailsSectionProps {
  formData: {
    amount: string;
    initialOffer: string;
    policyLimit: string;
    medicalExpenses: string;
  };
  errors: Record<string, string | undefined>;
  handleInputChange: (field: string, value: string) => void;
}

export const FinancialDetailsSection = ({
  formData,
  errors,
  handleInputChange,
}: FinancialDetailsSectionProps) => {
  // Debug log when errors change
  useEffect(() => {
    const sectionErrors = Object.entries(errors)
      .filter(([key]) => ['amount', 'initialOffer', 'policyLimit', 'medicalExpenses'].includes(key))
      .filter(([_, value]) => !!value);
      
    if (sectionErrors.length > 0) {
      console.log("FinancialDetailsSection has errors:", Object.fromEntries(sectionErrors));
    }
  }, [errors]);

  return (
    <div className="space-y-6">
      <DollarInputField
        label="Settlement Amount*"
        value={formData.amount}
        onChange={(value) => handleInputChange("amount", value)}
        placeholder="$1,000,000"
        error={errors.amount}
      />

      <DollarInputField
        label="Initial Settlement Offer*"
        value={formData.initialOffer}
        onChange={(value) => handleInputChange("initialOffer", value)}
        placeholder="$0"
        description="Enter the initial offer received, if any. Enter $0 if none."
        error={errors.initialOffer}
      />

      <DollarInputField
        label="Insurance Policy Limit*"
        value={formData.policyLimit}
        onChange={(value) => handleInputChange("policyLimit", value)}
        placeholder="$0"
        error={errors.policyLimit}
      />

      <DollarInputField
        label="Medical Expenses*"
        value={formData.medicalExpenses}
        onChange={(value) => handleInputChange("medicalExpenses", value)}
        placeholder="$0"
        error={errors.medicalExpenses}
      />
    </div>
  );
};
