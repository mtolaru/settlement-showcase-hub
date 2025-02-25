
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { SettlementDetailsForm } from "@/components/settlement/SettlementDetailsForm";
import { AttorneyInformationForm } from "@/components/settlement/AttorneyInformationForm";
import { SubmissionProgress } from "@/components/settlement/SubmissionProgress";
import { supabase } from "@/integrations/supabase/client";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface FormData {
  amount: string;
  initialOffer: string;
  policyLimit: string;
  medicalExpenses: string;
  settlementPhase: string;
  caseType: string;
  otherCaseType: string;
  caseDescription: string;
  caseDetails: {
    carAccident: {
      vehicleType: string;
      injuryType: string;
      atFault: string;
    };
    workplaceInjury: {
      injuryType: string;
      workSector: string;
      employerSize: string;
    };
    medicalMalpractice: {
      procedureType: string;
      facilityType: string;
      injuryType: string;
    };
    slipAndFall: {
      locationType: string;
      injuryType: string;
      propertyType: string;
    };
  };
  attorneyName: string;
  attorneyEmail: string;
  firmName: string;
  firmWebsite: string;
  location: string;
  photoUrl: string;
}

const SubmitSettlement = () => {
  const [step, setStep] = useState(1);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: subscriptions, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .gt('ends_at', new Date().toISOString())
          .maybeSingle();

        if (error) throw error;
        
        setHasActiveSubscription(!!subscriptions);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify subscription status. Please try again.",
      });
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const [formData, setFormData] = useState<FormData>({
    amount: "",
    initialOffer: "",
    policyLimit: "",
    medicalExpenses: "",
    settlementPhase: "",
    caseType: "",
    otherCaseType: "",
    caseDescription: "",
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

  const handleInputChange = (field: string, value: string) => {
    const numericFields = ['amount', 'initialOffer', 'policyLimit', 'medicalExpenses'];
    if (numericFields.includes(field)) {
      const unformattedValue = unformatNumber(value);
      const formattedValue = formatNumber(unformattedValue);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  const handleImageUpload = (url: string) => {
    handleInputChange("photoUrl", url);
  };

  const handlePaymentSuccess = async (result: any) => {
    toast({
      title: "Success",
      description: "Your settlement has been submitted successfully.",
    });
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    const validateMoneyField = (field: string, label: string) => {
      const value = unformatNumber(formData[field]);
      if (!value || !validateNumber(value)) {
        newErrors[field] = `Please enter a valid ${label} greater than 0`;
      }
    };

    validateMoneyField('amount', 'settlement amount');
    validateMoneyField('initialOffer', 'amount');
    validateMoneyField('policyLimit', 'amount');
    validateMoneyField('medicalExpenses', 'amount');

    if (!formData.settlementPhase) {
      newErrors.settlementPhase = "Please select when the settlement was made";
    }

    if (!formData.caseType) {
      newErrors.caseType = "Please select a case type";
    }

    if (formData.caseType === "Other" && !formData.otherCaseType) {
      newErrors.otherCaseType = "Please describe what 'Other' means";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
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

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields correctly.",
      });
      return;
    }

    if (step === 2 && !validateStep2()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields correctly.",
      });
      return;
    }

    if (step === 2 && !hasActiveSubscription) {
      setStep(3);
    } else if (step === 2) {
      handleSubmitWithSubscription();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmitWithSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error("No authenticated user found");
      }

      const submissionData = {
        amount: Number(unformatNumber(formData.amount)),
        attorney: formData.attorneyName,
        firm: formData.firmName,
        firm_website: formData.firmWebsite,
        location: formData.location,
        type: formData.caseType === "Other" ? formData.otherCaseType : formData.caseType,
        description: formData.caseDescription,
        case_description: formData.caseDescription,
        initial_offer: Number(unformatNumber(formData.initialOffer)),
        policy_limit: Number(unformatNumber(formData.policyLimit)),
        medical_expenses: Number(unformatNumber(formData.medicalExpenses)),
        settlement_phase: formData.settlementPhase,
        photo_url: formData.photoUrl,
        user_id: session.user.id,
        payment_completed: true
      };

      const { data, error } = await supabase
        .from('settlements')
        .insert(submissionData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your settlement has been submitted successfully.",
      });

      navigate('/settlements');
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit settlement. Please try again.",
      });
    }
  };

  const ReviewStep = () => {
    const formatCurrency = (value: string) => {
      return value ? `$${value}` : "N/A";
    };

    const createCheckoutSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please sign in to continue.",
          });
          return;
        }

        const response = await supabase.functions.invoke('create-checkout-session', {
          body: {
            settlementData: formData,
            userId: session.user.id,
            returnUrl: `${window.location.origin}/confirmation`,
          },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        const { url } = response.data;
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (error) {
        console.error('Error creating checkout session:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initiate checkout. Please try again.",
        });
      }
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
              onClick={createCheckoutSession}
              className="w-full bg-primary-500 hover:bg-primary-600"
            >
              Subscribe Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {hasActiveSubscription && (
          <Button 
            onClick={handleSubmitWithSubscription}
            className="w-full bg-primary-500 hover:bg-primary-600"
          >
            Submit Settlement
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  if (isCheckingSubscription) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-neutral-600">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-primary-900 text-white py-12">
        <div className="container">
          <Link to="/">
            <Button variant="ghost" className="text-white mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold font-display mb-4">
            Submit Your Settlement
          </h1>
          <p className="text-primary-200 max-w-2xl">
            Share your success story and join the leading platform for personal
            injury settlements.
          </p>
        </div>
      </div>

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

            {step === 3 && <ReviewStep />}

            <div className="flex justify-between mt-8 pt-6 border-t border-neutral-100">
              {step > 1 && (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}
              {step < 3 && (
                <div className="ml-auto">
                  <Button onClick={handleNextStep} className="bg-primary-500 hover:bg-primary-600">
                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SubmitSettlement;
