
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettlementForm } from "@/hooks/useSettlementForm";

interface FormErrors {
  [key: string]: string | undefined;
}

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
    setTemporaryId(crypto.randomUUID());
    
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
        // Add logging to debug subscription status check
        console.log("Checking subscription status for user:", session.user.id);
        
        const { data: subscriptions, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .gt('ends_at', new Date().toISOString())
          .maybeSingle();

        if (error) {
          console.error('Error checking subscription:', error);
          throw error;
        }
        
        // Log the subscription result
        console.log("Subscription query result:", subscriptions);
        
        // Check if the user has an active subscription
        const hasActiveSubscription = !!subscriptions;
        console.log("Setting hasActiveSubscription to:", hasActiveSubscription);
        
        setHasActiveSubscription(hasActiveSubscription);
        
        // If we didn't find a subscription by user_id, try checking if there's one without an end date
        if (!hasActiveSubscription) {
          const { data: openSubscriptions, error: openError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .is('ends_at', null)
            .maybeSingle();
            
          if (openError) {
            console.error('Error checking open-ended subscription:', openError);
          } else {
            console.log("Open-ended subscription check result:", openSubscriptions);
            if (openSubscriptions) {
              console.log("Found open-ended subscription, setting hasActiveSubscription to true");
              setHasActiveSubscription(true);
            }
          }
        }
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
    if (isAuthenticated && user?.email === email) {
      return false;
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
    
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));

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
