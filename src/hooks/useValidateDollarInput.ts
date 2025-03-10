
import { FormData } from "@/types/settlementForm";

export const useValidateDollarInput = (
  formData: FormData,
  handleInputChange: (field: string, value: string) => void
) => {
  // Validate numeric input for dollar fields without using hooks
  const validateDollarInput = (value: string, field: string) => {
    if (value) {
      const numericValue = value.replace(/[^0-9,.]/g, '');
      if (numericValue !== value) {
        handleInputChange(field, numericValue);
      }
    }
  };

  // Validate all dollar fields
  const validateAllDollarFields = () => {
    validateDollarInput(formData.amount, 'amount');
    validateDollarInput(formData.initialOffer, 'initialOffer');
    validateDollarInput(formData.policyLimit, 'policyLimit');
    validateDollarInput(formData.medicalExpenses, 'medicalExpenses');
  };

  return { validateDollarInput, validateAllDollarFields };
};
