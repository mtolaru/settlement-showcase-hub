
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ReviewStepProps {
  formData: {
    amount: string;
    initialOffer: string;
    policyLimit: string;
    medicalExpenses: string;
    caseType: string;
    otherCaseType: string;
    settlementPhase: string;
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
  const formatCurrency = (value: string) => {
    return value ? `$${value}` : "N/A";
  };

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
                  <dd className="font-medium">{formData.caseType === "Other" ? formData.otherCaseType : formData.caseType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Settlement Phase</dt>
                  <dd className="font-medium">{formData.settlementPhase}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className="font-medium mb-4">Attorney Information</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-neutral-600">Attorney Name</dt>
                  <dd className="font-medium">{formData.attorneyName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Law Firm</dt>
                  <dd className="font-medium">{formData.firmName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Location</dt>
                  <dd className="font-medium">{formData.location}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Email</dt>
                  <dd className="font-medium">{formData.attorneyEmail}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Website</dt>
                  <dd className="font-medium">{formData.firmWebsite}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {!hasActiveSubscription && (
        <div className="bg-primary-50 border border-primary-100 p-6 rounded-lg">
          <h4 className="font-medium text-primary-900 mb-2">Professional Plan Subscription</h4>
          <p className="text-sm text-primary-700 mb-4">
            Subscribe to our Professional Plan for $199/month to submit and showcase your settlements.
          </p>
          <Button 
            onClick={onCreateCheckout}
            className="w-full bg-primary-500 hover:bg-primary-600"
          >
            Subscribe Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {hasActiveSubscription && (
        <Button 
          onClick={onSubmitWithSubscription}
          className="w-full bg-primary-500 hover:bg-primary-600"
        >
          Submit Settlement
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
