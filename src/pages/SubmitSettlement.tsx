import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { SettlementDetailsForm } from "@/components/settlement/SettlementDetailsForm";
import { AttorneyInformationForm } from "@/components/settlement/AttorneyInformationForm";
import { SubmissionProgress } from "@/components/settlement/SubmissionProgress";
import { ReviewStep } from "@/components/settlement/ReviewStep";
import { useSubmitSettlementForm } from "@/hooks/useSubmitSettlementForm";
import { LoadingState } from "@/components/settlement/LoadingState";
import { SettlementFormHeader } from "@/components/settlement/SettlementFormHeader";
import { FormNavigation } from "@/components/settlement/FormNavigation";
import { settlementService } from "@/services/settlementService";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const SubmitSettlement = () => {
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
      isCheckingSubscription
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

  const createCheckoutSession = async () => {
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
    if (step === 1 && !validateStep1(formData)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields correctly.",
      });
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
      
      if (!hasActiveSubscription) {
        setStep(3);
      } else {
        handleSubmitWithSubscription();
      }
    } else {
      setStep(step + 1);
    }
  };

  if (isCheckingSubscription) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <SettlementFormHeader />

      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <SubmissionProgress currentStep={step} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            {step === 1 && (
              <SettlementDetailsForm
                formData={formData}
                errors={errors}
                handleInputChange={handleInputChange}
              />
            )}

            {step === 2 && (
              <AttorneyInformationForm
                formData={formData}
                errors={errors}
                handleInputChange={handleInputChange}
                handleImageUpload={handleImageUpload}
              />
            )}

            {step === 3 && (
              <ReviewStep 
                formData={formData}
                hasActiveSubscription={hasActiveSubscription}
                onCreateCheckout={createCheckoutSession}
                onSubmitWithSubscription={handleSubmitWithSubscription}
              />
            )}

            <FormNavigation 
              step={step}
              onNext={handleNextStep}
              onBack={() => setStep(step - 1)}
              isLoading={isLoading}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SubmitSettlement;
