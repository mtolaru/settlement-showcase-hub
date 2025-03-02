
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettlementForm } from "@/hooks/useSettlementForm";

interface FormData {
  amount: string;
  initialOffer: string;
  policyLimit: string;
  medicalExpenses: string;
  settlementPhase: string;
  caseType: string;
  otherCaseType: string;
  caseDescription: string;
  settlementDate: string;
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

export const useSubmitSettlementForm = () => {
  const [step, setStep] = useState(1);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionLock, setSubmissionLock] = useState(false);
  const [temporaryId, setTemporaryId] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { errors, setErrors, validateStep1, validateStep2, unformatNumber } = useSettlementForm();
  const { user, isAuthenticated } = useAuth();

  // Set default date to today
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

  useEffect(() => {
    checkSubscriptionStatus();
    // Generate a temporary ID when the component mounts
    setTemporaryId(crypto.randomUUID());
    
    // Autofill email for authenticated users
    if (isAuthenticated && user?.email) {
      setFormData(prev => ({
        ...prev,
        attorneyEmail: user.email || ""
      }));
    }
  }, [isAuthenticated, user]);

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

  const verifyEmail = async (email: string) => {
    // Skip email verification for authenticated users with matching email
    if (isAuthenticated && user?.email === email) {
      return false; // Return false to indicate email doesn't exist (no conflict)
    }
    
    try {
      const { data, error } = await supabase
        .from('settlements')
        .select('attorney_email')
        .eq('attorney_email', email)
        .maybeSingle();

      if (error) {
        console.error('Error checking email:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('Exception checking email:', err);
      return false;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field changes
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));

    // If changing email, check if it exists (but skip for authenticated users with matching email)
    if (field === 'attorneyEmail' && value && !(isAuthenticated && user?.email === value)) {
      verifyEmail(value).then(emailExists => {
        if (emailExists) {
          setErrors(prev => ({
            ...prev,
            attorneyEmail: "This email is already associated with settlements. Please log in or use a different email."
          }));
        }
      });
    }
  };

  const handleImageUpload = (url: string) => {
    handleInputChange("photoUrl", url);
  };

  return {
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
  };
};
