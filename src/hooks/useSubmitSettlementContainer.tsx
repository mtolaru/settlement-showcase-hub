
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useSubmitSettlementForm } from "@/hooks/useSubmitSettlementForm";
import { settlementService } from "@/services/settlementService";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export const useSubmitSettlementContainer = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const {
    step,
    setStep,
    formData,
    errors,
    isCheckingSubscription,
    hasActiveSubscription,
    isLoading,
    isSubmitting,
    submissionLock,
    temporaryId,
    handleInputChange,
    handleImageUpload,
    setErrors,
    setIsLoading,
    setIsSubmitting,
    setSubmissionLock,
    validateStep1,
    validateStep2,
    verifyEmail,
    unformatNumber
  } = useSubmitSettlementForm();

  useEffect(() => {
    console.log("SubmitSettlement component - Current subscription status:", {
      isAuthenticated,
      userId: user?.id,
      hasActiveSubscription,
      isCheckingSubscription,
      hasActiveSubscriptionType: typeof hasActiveSubscription
    });
  }, [isAuthenticated, user, hasActiveSubscription, isCheckingSubscription]);

  const handleSubmitWithSubscription = async () => {
    if (submissionLock) return;
    setSubmissionLock(true);
    setIsSubmitting(true);
    
    try {
      const result = await settlementService.submitWithSubscription(
        temporaryId, 
        formData, 
        unformatNumber
      );
      
      if (result.isExisting) {
        toast({
          title: "Already Submitted",
          description: "This settlement has already been processed. Redirecting to settlements page.",
        });
      } else {
        toast({
          title: "Success",
          description: "Your settlement has been submitted successfully.",
        });
      }
      
      navigate('/settlements');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit settlement. Please try again.",
      });
      setSubmissionLock(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCheckout = async () => {
    if (submissionLock) return;
    setSubmissionLock(true);
    setIsLoading(true);
    
    try {
      if (formData.attorneyEmail && !(isAuthenticated && user?.email === formData.attorneyEmail)) {
        const emailExists = await verifyEmail(formData.attorneyEmail);
        if (emailExists) {
          setErrors(prev => ({
            ...prev,
            attorneyEmail: "This email is already associated with settlements. Please log in or use a different email."
          }));
          setIsLoading(false);
          setSubmissionLock(false);
          setStep(2);
          return;
        }
      }
      
      const response = await settlementService.createCheckoutSession(
        temporaryId, 
        formData, 
        unformatNumber
      );
      
      if (response.isExisting) {
        toast({
          title: "Already Submitted",
          description: "This settlement has already been processed. Redirecting to settlements page.",
        });
        navigate('/settlements');
        return;
      }
      
      const { url } = response;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate checkout. Please try again.",
      });
      setSubmissionLock(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!validateStep1(formData)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please fill in all required fields correctly.",
        });
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (isAuthenticated && user?.email) {
        if (!validateStep2(formData, true)) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please fill in all required fields correctly.",
          });
          return;
        }
      } else {
        if (formData.attorneyEmail) {
          const emailExists = await verifyEmail(formData.attorneyEmail);
          if (emailExists) {
            setErrors(prev => ({
              ...prev,
              attorneyEmail: "This email is already associated with settlements. Please log in or use a different email."
            }));
            toast({
              variant: "destructive",
              title: "Email Already Exists",
              description: "Please use a different email or log in to submit another case.",
            });
            return;
          }
        }
        
        if (!validateStep2(formData, false)) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please fill in all required fields correctly.",
          });
          return;
        }
      }
      
      // Always proceed to step 3 (review) regardless of subscription status
      setStep(3);
    }
  };

  const handleBackStep = () => setStep(step - 1);

  return {
    step,
    formData,
    errors,
    isCheckingSubscription,
    hasActiveSubscription,
    isLoading,
    isSubmitting,
    handleInputChange,
    handleImageUpload,
    handleNextStep,
    handleBackStep,
    handleCreateCheckout,
    handleSubmitWithSubscription
  };
};
