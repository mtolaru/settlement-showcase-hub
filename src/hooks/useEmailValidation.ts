
import { useState, useEffect, useRef } from "react";
import { verifyEmail } from "@/utils/emailUtils";
import { useAuth } from "@/hooks/useAuth";
import { FormErrors } from "@/types/settlementForm";

export const useEmailValidation = (
  email: string,
  isValidEmail: (email: string) => boolean,
  setErrors: (errors: FormErrors | ((prev: FormErrors) => FormErrors)) => void
) => {
  const { user, isAuthenticated } = useAuth();
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedEmailRef = useRef<string>("");
  const lastValidatedEmailRef = useRef<string>("");

  // Only validate the email when it changes and is not empty
  useEffect(() => {
    // Skip validation if email is empty
    if (!email) {
      setAlreadyExists(false);
      setIsValidatingEmail(false);
      return;
    }

    // Skip validation if user is authenticated and using their own email
    if (isAuthenticated && user?.email === email) {
      console.log("Email matches authenticated user, skipping validation");
      setAlreadyExists(false);
      setIsValidatingEmail(false);
      
      // Clear email errors if it's the current user's email
      setErrors((prev: FormErrors) => {
        const newErrors = { ...prev };
        delete newErrors.attorneyEmail;
        return newErrors;
      });
      return;
    }

    // Clear any previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = null;
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

    // Don't revalidate if we already checked this email
    if (email === lastValidatedEmailRef.current) {
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
            lastValidatedEmailRef.current = email;
            
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
        // Clear the validating state even if there was an error
        if (email === lastCheckedEmailRef.current) {
          setIsValidatingEmail(false);
        }
      } finally {
        // Only update loading state if this is still the current email
        if (email === lastCheckedEmailRef.current) {
          setIsValidatingEmail(false);
        }
      }
    }, 500);
  }, [email, isAuthenticated, user?.email, isValidEmail, setErrors]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
    };
  }, []);

  return { isValidatingEmail, alreadyExists };
};
