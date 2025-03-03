
import { motion } from "framer-motion";
import { SettlementDetailsForm } from "@/components/settlement/SettlementDetailsForm";
import { AttorneyInformationForm } from "@/components/settlement/AttorneyInformationForm";
import { SubmissionProgress } from "@/components/settlement/SubmissionProgress";
import { ReviewStep } from "@/components/settlement/ReviewStep";
import { LoadingState } from "@/components/settlement/LoadingState";
import { SettlementFormHeader } from "@/components/settlement/SettlementFormHeader";
import { FormNavigation } from "@/components/settlement/FormNavigation";
import { useSubmitSettlementContainer } from "@/hooks/useSubmitSettlementContainer";
import { useEffect } from "react";

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
    handleSubmitWithSubscription
  } = useSubmitSettlementContainer();

  useEffect(() => {
    console.log("SubmitSettlementPage rendering, current step:", step);
    // Log errors whenever they change
    if (Object.keys(errors).length > 0) {
      console.log("Current form errors:", errors);
    }
  }, [step, errors]);

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
            key={`step-${step}`}
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
    </div>
  );
};

export default SubmitSettlementPage;
