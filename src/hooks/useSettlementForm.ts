
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";

export const useSettlementForm = () => {
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const formatNumber = (value: string): string => {
    const number = value.replace(/\D/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const unformatNumber = (value: string): string => {
    return value.replace(/,/g, '');
  };

  const validateNumber = (value: string) => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  };

  const validateMoneyField = (field: string, value: string, label: string) => {
    const unformattedValue = unformatNumber(value);
    if (!unformattedValue || !validateNumber(unformattedValue)) {
      return `Please enter a valid ${label} greater than 0`;
    }
    return undefined;
  };
  
  const validateDateField = (value: string) => {
    if (!value) {
      return "Settlement date is required";
    }
    
    // Check if date is valid and not in the future
    const inputDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for proper comparison
    
    if (isNaN(inputDate.getTime())) {
      return "Please enter a valid date";
    }
    
    if (inputDate > today) {
      return "Settlement date cannot be in the future";
    }
    
    return undefined;
  };

  const validateStep1 = (formData: any) => {
    const newErrors: Record<string, string> = {};

    // Validate money fields
    ['amount', 'initialOffer', 'policyLimit', 'medicalExpenses'].forEach(field => {
      const label = field.replace(/([A-Z])/g, ' $1').toLowerCase();
      const error = validateMoneyField(field, formData[field], label);
      if (error) newErrors[field] = error;
    });
    
    // Validate settlement date
    const dateError = validateDateField(formData.settlementDate);
    if (dateError) newErrors.settlementDate = dateError;

    // Validate other required fields
    if (!formData.settlementPhase) {
      newErrors.settlementPhase = "Please select when the settlement was made";
    }

    if (!formData.caseType) {
      newErrors.caseType = "Please select a case type";
    }

    if (formData.caseType === "Other" && !formData.otherCaseType) {
      newErrors.otherCaseType = "Please describe what 'Other' means";
    }

    if (!formData.caseDescription?.trim()) {
      newErrors.caseDescription = "Please provide a description of the case";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (formData: any) => {
    const newErrors: Record<string, string> = {};

    if (!formData.attorneyName?.trim()) {
      newErrors.attorneyName = "Attorney name is required";
    }

    if (!formData.attorneyEmail?.trim()) {
      newErrors.attorneyEmail = "Attorney email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.attorneyEmail)) {
      newErrors.attorneyEmail = "Please enter a valid email address";
    }

    if (!formData.firmName?.trim()) {
      newErrors.firmName = "Law firm name is required";
    }

    if (!formData.firmWebsite?.trim()) {
      newErrors.firmWebsite = "Law firm website is required";
    } else if (!/^https?:\/\/.+/.test(formData.firmWebsite)) {
      newErrors.firmWebsite = "Please enter a valid website URL (starting with http:// or https://)";
    }

    if (!formData.location?.trim()) {
      newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    errors,
    setErrors,
    formatNumber,
    unformatNumber,
    validateNumber,
    validateStep1,
    validateStep2,
    validateDateField
  };
};
