import { useState, useCallback, useRef } from 'react';
import { trackFormFieldCompletion } from '@/utils/analytics';

export const useSettlementFormState = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    initialOffer: '',
    policyLimit: '',
    medicalExpenses: '',
    caseType: '',
    otherCaseType: '',
    caseDescription: '',
    settlementPhase: '',
    settlementDate: '',
    attorneyName: '',
    attorneyEmail: '',
    firmName: '',
    firmWebsite: '',
    location: '',
    photoUrl: ''
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionLock, setSubmissionLock] = useState(false);
  const [temporaryId, setTemporaryId] = useState<string | null>(null);
  const [clearedFields, setClearedFields] = useState(new Set<string>());

  const clearFormField = useCallback((fieldName: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: ''
    }));
    setClearedFields(prev => new Set(prev).add(fieldName));
  }, []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Track form field completion
    if (value) {
      const stepMap: { [key: string]: string } = {
        amount: 'settlement_details',
        initialOffer: 'settlement_details',
        policyLimit: 'settlement_details',
        medicalExpenses: 'settlement_details',
        caseType: 'settlement_details',
        caseDescription: 'settlement_details',
        settlementDate: 'settlement_details',
        attorneyName: 'attorney_information',
        attorneyEmail: 'attorney_information',
        firmName: 'attorney_information',
        firmWebsite: 'attorney_information',
        location: 'attorney_information'
      };

      trackFormFieldCompletion({
        field_name: field,
        step: stepMap[field] || 'unknown'
      });
    }
  }, [setFormData]);

  const handleImageUpload = useCallback((url: string) => {
    setFormData(prev => ({
      ...prev,
      photoUrl: url
    }));
  }, [setFormData]);

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
    clearFormField,
    clearedFields
  };
};
