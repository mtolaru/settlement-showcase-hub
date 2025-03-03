
import { useEffect } from "react";
import { FormData } from "@/types/settlementForm";

export const useValidateDollarInput = (
  formData: FormData,
  handleInputChange: (field: string, value: string) => void
) => {
  // Validate numeric input for dollar fields
  const validateDollarInput = (value: string, field: string) => {
    if (value) {
      const numericValue = value.replace(/[^0-9,.]/g, '');
      if (numericValue !== value) {
        handleInputChange(field, numericValue);
      }
    }
  };

  // Add real-time validation for dollar fields
  useEffect(() => {
    validateDollarInput(formData.amount, 'amount');
    validateDollarInput(formData.initialOffer, 'initialOffer');
    validateDollarInput(formData.policyLimit, 'policyLimit');
    validateDollarInput(formData.medicalExpenses, 'medicalExpenses');
  }, [
    formData.amount,
    formData.initialOffer,
    formData.policyLimit,
    formData.medicalExpenses,
    handleInputChange
  ]);

  return { validateDollarInput };
};
