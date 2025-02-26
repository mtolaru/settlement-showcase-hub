import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { SettlementDetailsForm } from "@/components/settlement/SettlementDetailsForm";
import { AttorneyInformationForm } from "@/components/settlement/AttorneyInformationForm";
import { SubmissionProgress } from "@/components/settlement/SubmissionProgress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setHasActiveSubscription(false);
        return;
      }

      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('ends_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error checking subscription:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to verify subscription status.",
        });
      } else {
        setHasActiveSubscription(!!subscriptions);
      }
    };

    checkSubscription();
  }, [user]);

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

  const handleSubmitSettlement = async () => {
    try {
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
        user_id: user?.id || null,
        payment_completed: hasActiveSubscription
      };

      const { data, error } = await supabase
        .from('settlements')
        .insert(submissionData)
        .select()
        .single();

      if (error) throw error;

      if (!hasActiveSubscription) {
        navigate('/payment-selection', { 
          state: { 
            settlementId: data.id,
            amount: formData.amount 
          } 
        });
      } else {
        toast({
          title: "Success",
          description: "Your settlement has been submitted successfully.",
        });
        navigate('/settlements');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit settlement. Please try again.",
      });
    }
  };

  const handleNextStep = async () => {
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

    if (step === 2) {
      await handleSubmitSettlement();
    } else {
      setStep(step + 1);
    }
  };

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

            <div className="flex justify-between mt-8 pt-6 border-t border-neutral-100">
              {step > 1 && (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}
              <div className="ml-auto">
                <Button onClick={handleNextStep} className="bg-primary-500 hover:bg-primary-600">
                  {step === 2 ? "Next Step" : "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SubmitSettlement;
