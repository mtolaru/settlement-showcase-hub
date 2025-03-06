
import { useState } from "react";
import { FormData, FormErrors } from "@/types/settlementForm";

export const useSettlementFormState = () => {
  const [step, setStep] = useState(1);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionLock, setSubmissionLock] = useState(false);
  const [temporaryId, setTemporaryId] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});

  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [formData, setFormData] = useState<FormData>({
    amount: "",
    initialOffer: "",
    policyLimit: "",
    medicalExpenses: "",
    settlementPhase: "",
    caseType: "",
    otherCaseType: "",
    caseDescription: "",
    settlementDate: defaultDate,
    caseDetails: {
      carAccident: {
        vehicleType: "",
        injuryType: "",
        atFault: ""
      },
      workplaceInjury: {
        injuryType: "",
        workSector: "",
        employerSize: ""
      },
      medicalMalpractice: {
        procedureType: "",
        facilityType: "",
        injuryType: ""
      },
      slipAndFall: {
        locationType: "",
        injuryType: "",
        propertyType: ""
      }
    },
    attorneyName: "",
    attorneyEmail: "",
    firmName: "",
    firmWebsite: "",
    location: "",
    photoUrl: ""
  });

  const handleInputChange = (field: string, value: string) => {
    console.log(`Setting field ${field} to: ${value}`);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  const clearFormField = (field: string) => {
    console.log(`Explicitly clearing field ${field}`);
    setFormData(prev => ({
      ...prev,
      [field]: ""
    }));
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleImageUpload = (url: string) => {
    handleInputChange("photoUrl", url);
  };

  return {
    step,
    setStep,
    formData,
    setFormData,
    errors,
    setErrors,
    isCheckingSubscription,
    setIsCheckingSubscription,
    hasActiveSubscription,
    setHasActiveSubscription,
    isLoading,
    setIsLoading,
    isSubmitting,
    setIsSubmitting,
    submissionLock,
    setSubmissionLock,
    temporaryId,
    setTemporaryId,
    handleInputChange,
    handleImageUpload,
    clearFormField
  };
};
