
import { useState, useEffect } from "react";
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

  const handleEmailChange = async (email: string) => {
    // Check if the email belongs to the currently logged-in user
    const isCurrentUserEmail = user?.email === email;
    
    if (email && !isCurrentUserEmail) {
      // First validate email format before checking if it exists
      if (!isValidEmail(email)) {
        setErrors((prev: FormErrors) => ({
          ...prev,
          attorneyEmail: "Please enter a valid email address"
        }));
        setAlreadyExists(false);
        return;
      }

      setIsValidatingEmail(true);
      try {
        const emailExists = await verifyEmail(email, user?.email);
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
      } catch (error) {
        console.error("Error validating email:", error);
      } finally {
        setIsValidatingEmail(false);
      }
    } else if (isCurrentUserEmail) {
      // Clear any existing errors for the email if it belongs to the current user
      setErrors((prev: FormErrors) => {
        const newErrors = { ...prev };
        if (newErrors.attorneyEmail) {
          delete newErrors.attorneyEmail;
        }
        return newErrors;
      });
      setAlreadyExists(false);
      setIsValidatingEmail(false);
    }
  };

  useEffect(() => {
    if (email) {
      const timer = setTimeout(() => {
        handleEmailChange(email);
      }, 500); // Debounce email validation
      
      return () => clearTimeout(timer);
    }
  }, [email]);

  return { handleEmailChange, isValidatingEmail, alreadyExists };
};
