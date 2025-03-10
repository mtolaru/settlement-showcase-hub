
import { motion } from "framer-motion";
import { SettlementDetailsForm } from "@/components/settlement/SettlementDetailsForm";
import { AttorneyInformationForm } from "@/components/settlement/AttorneyInformationForm";
import { SubmissionProgress } from "@/components/settlement/SubmissionProgress";
import { ReviewStep } from "@/components/settlement/ReviewStep";
import { LoadingState } from "@/components/settlement/LoadingState";
import { SettlementFormHeader } from "@/components/settlement/SettlementFormHeader";
import { FormNavigation } from "@/components/settlement/FormNavigation";
import { useSubmitSettlementContainer } from "@/hooks/useSubmitSettlementContainer";
import { useEffect, memo, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";

// Memoize form components to prevent unnecessary re-renders
const MemoizedSettlementDetailsForm = memo(SettlementDetailsForm);
const MemoizedAttorneyInformationForm = memo(AttorneyInformationForm);
const MemoizedReviewStep = memo(ReviewStep);

const SubmitSettlementPage = () => {
  const {
    step,
    formData,
    errors,
    hasActiveSubscription,
    isLoading,
    isSubmitting,
    isCheckingSubscription,
    handleInputChange,
    handleImageUpload,
    handleNextStep,
    handleBackStep,
    handleCreateCheckout,
    handleSubmitWithSubscription,
    emailStatus,
    isAuthenticated,
    clearFormField,
    clearedFields
  } = useSubmitSettlementContainer();

  // Logging outside of any hook functions
  useEffect(() => {
    console.log("SubmitSettlementPage rendering, current step:", step);
    
    // Log which fields have errors for debugging
    if (Object.keys(errors).length > 0) {
      const errorFields = Object.entries(errors)
        .filter(([_, value]) => !!value)
        .map(([key]) => key);
      
      console.log("Fields with validation errors:", errorFields);
    }
  }, [step, errors]);

  // Calculate if loader is visible outside of any hook functions
  const isLoaderVisible = isCheckingSubscription;

  if (isLoaderVisible) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-white">
      <SettlementFormHeader />

      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <SubmissionProgress currentStep={step} />

          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            {step === 1 && (
              <MemoizedSettlementDetailsForm
                formData={formData}
                errors={errors}
                handleInputChange={handleInputChange}
              />
            )}

            {step === 2 && (
              <MemoizedAttorneyInformationForm
                formData={formData}
                errors={errors}
                handleInputChange={handleInputChange}
                handleImageUpload={handleImageUpload}
                clearFormField={clearFormField}
                emailStatus={emailStatus}
                isAuthenticated={isAuthenticated}
                clearedFields={clearedFields}
              />
            )}

            {step === 3 && (
              <MemoizedReviewStep 
                formData={formData}
                hasActiveSubscription={hasActiveSubscription === true}
                onCreateCheckout={handleCreateCheckout}
                onSubmitWithSubscription={handleSubmitWithSubscription}
              />
            )}

            <FormNavigation 
              step={step}
              onNext={handleNextStep}
              onBack={handleBackStep}
              isLoading={isLoading}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default SubmitSettlementPage;
