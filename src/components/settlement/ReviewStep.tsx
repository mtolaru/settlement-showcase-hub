
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface ReviewStepProps {
  formData: {
    amount: string;
    initialOffer: string;
    policyLimit: string;
    medicalExpenses: string;
    caseType: string;
    otherCaseType: string;
    caseDescription: string;
    settlementPhase: string;
    settlementDate: string;
    attorneyName: string;
    attorneyEmail: string;
    firmName: string;
    firmWebsite: string;
    location: string;
  };
  hasActiveSubscription: boolean;
  onCreateCheckout: () => void;
  onSubmitWithSubscription: () => void;
}

export const ReviewStep = ({ 
  formData, 
  hasActiveSubscription, 
  onCreateCheckout,
  onSubmitWithSubscription 
}: ReviewStepProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add a debugging effect to log subscription status changes
  useEffect(() => {
    console.log("ReviewStep: hasActiveSubscription value changed to:", hasActiveSubscription);
  }, [hasActiveSubscription]);
  
  const formatCurrency = (value: string) => {
    if (!value) return "N/A";
    
    // Remove any existing formatting
    const numericValue = value.replace(/[$,]/g, '');
    
    // Format with commas for thousands
    return `$${Number(numericValue).toLocaleString('en-US')}`;
  };

  const formatSettlementPhase = (phase: string) => {
    if (phase === "pre-litigation") return "Pre-Litigation";
    if (phase === "during-litigation") return "During Litigation";
    return phase;
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  const handleCheckout = () => {
    setIsSubmitting(true);
    try {
      onCreateCheckout();
    } catch (error) {
      console.error("Error in handleCheckout:", error);
      setIsSubmitting(false);
    }
  };
  
  const handleSubmit = () => {
    setIsSubmitting(true);
    try {
      onSubmitWithSubscription();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setIsSubmitting(false);
    }
  };

  // Add this for better debugging
  console.log("ReviewStep render with hasActiveSubscription:", hasActiveSubscription, typeof hasActiveSubscription);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Review Your Settlement</h3>
        <div className="space-y-6 bg-neutral-50 p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-4">Settlement Details</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-neutral-600">Settlement Amount</dt>
                  <dd className="font-medium">{formatCurrency(formData.amount)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Settlement Date</dt>
                  <dd className="font-medium">{formatDate(formData.settlementDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Initial Offer</dt>
                  <dd className="font-medium">{formatCurrency(formData.initialOffer)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Policy Limit</dt>
                  <dd className="font-medium">{formatCurrency(formData.policyLimit)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Medical Expenses</dt>
                  <dd className="font-medium">{formatCurrency(formData.medicalExpenses)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Case Type</dt>
                  <dd className="font-medium break-words">{formData.caseType === "Other" ? formData.otherCaseType : formData.caseType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Settlement Phase</dt>
                  <dd className="font-medium">{formatSettlementPhase(formData.settlementPhase)}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className="font-medium mb-4">Attorney Information</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-neutral-600">Attorney Name</dt>
                  <dd className="font-medium break-words">{formData.attorneyName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Attorney Email</dt>
                  <dd className="font-medium break-words">{formData.attorneyEmail}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Law Firm</dt>
                  <dd className="font-medium break-words">{formData.firmName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Location</dt>
                  <dd className="font-medium break-words">{formData.location}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Website</dt>
                  <dd className="font-medium break-words overflow-hidden text-ellipsis">{formData.firmWebsite}</dd>
                </div>
              </dl>
            </div>
          </div>

          {formData.caseDescription && (
            <div className="pt-4 border-t border-neutral-200">
              <h4 className="font-medium mb-2">Case Description</h4>
              <p className="text-neutral-700 break-words whitespace-pre-wrap">{formData.caseDescription}</p>
            </div>
          )}
        </div>
      </div>

      {hasActiveSubscription === false ? (
        <div className="bg-primary-50 border border-primary-100 p-6 rounded-lg">
          <h4 className="font-medium text-primary-900 mb-2">Professional Plan Subscription</h4>
          <p className="text-sm text-primary-700 mb-4">
            Subscribe to our Professional Plan for $199/month to submit and showcase your settlements.
          </p>
          <Button 
            onClick={handleCheckout}
            className="w-full bg-primary-500 hover:bg-primary-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Subscribe Now"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button 
          onClick={handleSubmit}
          className="w-full bg-primary-500 hover:bg-primary-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Post Settlement"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
