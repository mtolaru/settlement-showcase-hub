
import { useState, useEffect } from "react";
import { FormErrors } from "@/types/settlementForm";

export const useSettlementForm = () => {
  const [errors, setErrors] = useState<FormErrors>({});

  // Function to convert formatted numbers (e.g., $1,000) to plain numbers
  const unformatNumber = (value: string): string => {
    return value.replace(/[^0-9.-]+/g, "");
  };

  // Function to validate step 1 of the settlement form
  const validateStep1 = (formData: any): boolean => {
    console.log("Running validateStep1 with data:", formData);
    const newErrors: FormErrors = {};
    let isValid = true;

    // Check if amount is provided and is a valid number
    if (!formData.amount) {
      newErrors.amount = "Settlement amount is required";
      isValid = false;
    } else if (isNaN(Number(unformatNumber(formData.amount)))) {
      newErrors.amount = "Please enter a valid number";
      isValid = false;
    }

    // Validate initial offer - now required
    if (!formData.initialOffer) {
      newErrors.initialOffer = "Initial offer is required";
      isValid = false;
    } else if (isNaN(Number(unformatNumber(formData.initialOffer)))) {
      newErrors.initialOffer = "Please enter a valid number";
      isValid = false;
    }

    // Validate policy limit - now required
    if (!formData.policyLimit) {
      newErrors.policyLimit = "Policy limit is required";
      isValid = false;
    } else if (isNaN(Number(unformatNumber(formData.policyLimit)))) {
      newErrors.policyLimit = "Please enter a valid number";
      isValid = false;
    }

    // Validate medical expenses - now required
    if (!formData.medicalExpenses) {
      newErrors.medicalExpenses = "Medical expenses are required";
      isValid = false;
    } else if (isNaN(Number(unformatNumber(formData.medicalExpenses)))) {
      newErrors.medicalExpenses = "Please enter a valid number";
      isValid = false;
    }

    // Check if settlement phase is selected
    if (!formData.settlementPhase) {
      newErrors.settlementPhase = "Please select a settlement phase";
      isValid = false;
    }

    // Check if case type is selected
    if (!formData.caseType) {
      newErrors.caseType = "Please select a case type";
      isValid = false;
    }

    // If "Other" is selected as case type, check if other case type is provided
    if (formData.caseType === "Other" && !formData.otherCaseType) {
      newErrors.otherCaseType = "Please specify the case type";
      isValid = false;
    }

    // Validate case description
    if (!formData.caseDescription || formData.caseDescription.trim().length < 10) {
      newErrors.caseDescription = "Please provide a detailed case description (at least 10 characters)";
      isValid = false;
    }

    // Validate settlement date
    if (!formData.settlementDate) {
      newErrors.settlementDate = "Settlement date is required";
      isValid = false;
    }

    console.log("Step 1 validation produced errors:", newErrors, "isValid:", isValid);
    
    // Check if any field has an error
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      console.log("Fields with errors:", errorKeys);
    }
    
    // CRITICAL: Always set errors, even if validation passes (with an empty object)
    setErrors(newErrors);
    return isValid;
  };

  // Function to validate step 2 of the settlement form
  const validateStep2 = (formData: any, skipEmailValidation: boolean = false): boolean => {
    console.log("Running validateStep2 with data:", formData, "skipEmailValidation:", skipEmailValidation);
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate attorney name
    if (!formData.attorneyName) {
      newErrors.attorneyName = "Attorney name is required";
      isValid = false;
    }

    // Validate attorney email (unless we're skipping email validation)
    if (!skipEmailValidation) {
      if (!formData.attorneyEmail) {
        newErrors.attorneyEmail = "Email is required";
        isValid = false;
      } else if (!isValidEmail(formData.attorneyEmail)) {
        newErrors.attorneyEmail = "Valid email is required";
        isValid = false;
      }
    }

    // Validate firm name
    if (!formData.firmName) {
      newErrors.firmName = "Firm name is required";
      isValid = false;
    }

    // Validate firm website - now required
    if (!formData.firmWebsite) {
      newErrors.firmWebsite = "Firm website is required";
      isValid = false;
    } else if (!isValidUrl(formData.firmWebsite)) {
      newErrors.firmWebsite = "Valid website URL is required";
      isValid = false;
    }

    // Validate location
    if (!formData.location) {
      newErrors.location = "Location is required";
      isValid = false;
    }

    // Validate photo upload
    if (!formData.photoUrl) {
      newErrors.photoUrl = "Attorney photo is required";
      isValid = false;
    }

    console.log("Step 2 validation produced errors:", newErrors, "isValid:", isValid);
    
    // Check if any field has an error
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      console.log("Fields with errors:", errorKeys);
    }
    
    // CRITICAL: Always set errors, even if validation passes (with an empty object)
    setErrors(newErrors);
    return isValid;
  };

  // Helper function to validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Helper function to validate URL format
  const isValidUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch (e) {
      return false;
    }
  };

  return {
    errors,
    setErrors,
    validateStep1,
    validateStep2,
    unformatNumber,
    isValidEmail,
    isValidUrl
  };
};
