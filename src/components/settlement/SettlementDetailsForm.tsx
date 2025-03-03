
import { useState, useEffect } from "react";
import { DateInputField } from "./form-fields/DateInputField";
import { FinancialDetailsSection } from "./form-sections/FinancialDetailsSection";
import { CaseDetailsSection } from "./form-sections/CaseDetailsSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
  const hasErrors = Object.values(errors).some(error => error !== undefined && error !== "");
  
  // This useEffect helps debug when errors change
  useEffect(() => {
    console.log("SettlementDetailsForm - Current errors:", errors);
    
    // Check for specific error fields
    const errorFields = Object.entries(errors)
      .filter(([_, value]) => !!value)
      .map(([key]) => key);
      
    if (errorFields.length > 0) {
      console.log("Fields with errors:", errorFields);
    }
  }, [errors]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Settlement Details</h2>
      
      {hasErrors && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fill in all required fields correctly to proceed.
          </AlertDescription>
        </Alert>
      )}
      
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
