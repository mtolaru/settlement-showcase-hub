
import { useState, useEffect, useRef } from "react";
import { verifyEmail } from "@/utils/emailUtils";
import { useAuth } from "@/hooks/useAuth";
import { FormErrors } from "@/types/settlementForm";

export const useEmailValidation = (
  email: string,
  isValidEmail: (email: string) => boolean,
  setErrors: (errors: FormErrors | ((prev: FormErrors) => FormErrors)) => void
) => {
  const { user } = useAuth();
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedEmailRef = useRef<string>("");

  const handleEmailChange = async (email: string) => {
    // Clear any previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Skip validation if email is empty or belongs to current user
    if (!email || (user?.email === email)) {
      setAlreadyExists(false);
      setIsValidatingEmail(false);
      
      // Clear email errors if it's the current user's email
      if (user?.email === email) {
        setErrors((prev: FormErrors) => {
          const newErrors = { ...prev };
          delete newErrors.attorneyEmail;
          return newErrors;
        });
      }
      return;
    }

    // First validate email format
    if (!isValidEmail(email)) {
      setErrors((prev: FormErrors) => ({
        ...prev,
        attorneyEmail: "Please enter a valid email address"
      }));
      setAlreadyExists(false);
      setIsValidatingEmail(false);
      return;
    }

    // Set loading state
    setIsValidatingEmail(true);

    // Store the current email being validated
    lastCheckedEmailRef.current = email;

    // Debounce the validation
    validationTimeoutRef.current = setTimeout(async () => {
      try {
        // Only proceed if this is still the current email
        if (email === lastCheckedEmailRef.current) {
          const emailExists = await verifyEmail(email, user?.email);
          
          // Only update state if this is still the current email
          if (email === lastCheckedEmailRef.current) {
            setAlreadyExists(emailExists);
            
            if (emailExists) {
              setErrors((prev: FormErrors) => ({
                ...prev,
                attorneyEmail: "This email is already associated with settlements. Please log in or use a different email."
              }));
            } else {
              // Clear the error if email doesn't exist
              setErrors((prev: FormErrors) => {
                const newErrors = { ...prev };
                if (newErrors.attorneyEmail && newErrors.attorneyEmail.includes("already associated")) {
                  delete newErrors.attorneyEmail;
                }
                return newErrors;
              });
            }
          }
        }
      } catch (error) {
        console.error("Error validating email:", error);
      } finally {
        // Only update loading state if this is still the current email
        if (email === lastCheckedEmailRef.current) {
          setIsValidatingEmail(false);
        }
      }
    }, 500);
  };

  useEffect(() => {
    // Reset validation state when email changes
    handleEmailChange(email);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [email]);

  return { handleEmailChange, isValidatingEmail, alreadyExists };
};
