
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
    
    // Handle both MM/DD/YYYY format and YYYY-MM-DD format
    let inputDate: Date | null = null;
    let isValidFormat = false;
    
    if (value.includes('/')) {
      // It's in MM/DD/YYYY format
      const parts = value.split('/');
      
      if (parts.length !== 3) {
        return "Please enter a valid date in MM/DD/YYYY format";
      }
      
      const [month, day, year] = parts;
      
      // Check if all parts exist and are valid numbers
      if (!month || !day || !year || 
          isNaN(Number(month)) || isNaN(Number(day)) || isNaN(Number(year))) {
        return "Please enter a valid date in MM/DD/YYYY format";
      }
      
      // Create a date object and check validity
      inputDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      isValidFormat = true;
      
      // Validate the actual date components
      const m = Number(month);
      const d = Number(day);
      const y = Number(year);
      
      if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 9999) {
        return "Please enter a valid date";
      }
      
    } else if (value.includes('-')) {
      // It's in YYYY-MM-DD format
      const parts = value.split('-');
      
      if (parts.length !== 3) {
        return "Please enter a valid date";
      }
      
      const [year, month, day] = parts;
      
      // Check if all parts exist and are valid numbers
      if (!year || !month || !day || 
          isNaN(Number(year)) || isNaN(Number(month)) || isNaN(Number(day))) {
        return "Please enter a valid date";
      }
      
      // Create a date object
      inputDate = new Date(value);
      isValidFormat = true;
    } else {
      return "Please enter a valid date in MM/DD/YYYY format";
    }
    
    // Check if date is valid
    if (!inputDate || isNaN(inputDate.getTime())) {
      return "Please enter a valid date";
    }
    
    // Verify the date is not invalid (e.g., Feb 31 would be converted to Mar 3)
    const formattedDate = inputDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const originalDate = value.includes('/') ? 
      `${value.split('/')[2]}-${value.split('/')[0].padStart(2, '0')}-${value.split('/')[1].padStart(2, '0')}` : 
      value;
    
    if (formattedDate !== originalDate && isValidFormat) {
      // Compare with more flexibility to account for leading zeros
      const [origYear, origMonth, origDay] = originalDate.split('-');
      const [formYear, formMonth, formDay] = formattedDate.split('-');
      
      if (Number(origYear) !== Number(formYear) || 
          Number(origMonth) !== Number(formMonth) || 
          Number(origDay) !== Number(formDay)) {
        return "The date you entered doesn't exist (e.g., February 31)";
      }
    }
    
    // Check if date is not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of day for proper comparison
    
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
