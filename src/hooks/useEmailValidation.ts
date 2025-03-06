
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
  const [lastCheckedEmail, setLastCheckedEmail] = useState("");

  const handleEmailChange = async (email: string) => {
    // Store the current email for which we're running validation
    const currentEmailCheck = email;
    setLastCheckedEmail(currentEmailCheck);
    
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
        console.log("Verifying if email exists:", email);
        const emailExists = await verifyEmail(email, user?.email);
        console.log("Email verification result:", emailExists, "for email:", email);
        
        // Only update state if this is still the latest email check
        if (currentEmailCheck === lastCheckedEmail) {
          setAlreadyExists(emailExists);
          
          if (emailExists) {
            console.log("Setting email already exists error");
            setErrors((prev: FormErrors) => ({
              ...prev,
              attorneyEmail: "This email is already associated with settlements. Please log in or use a different email."
            }));
          } else {
            // Clear the error if email doesn't exist
            console.log("Clearing email error as email doesn't exist");
            setErrors((prev: FormErrors) => {
              const newErrors = { ...prev };
              if (newErrors.attorneyEmail && newErrors.attorneyEmail.includes("already associated")) {
                delete newErrors.attorneyEmail;
              }
              return newErrors;
            });
          }
        } else {
          console.log("Ignoring stale email validation result for:", email, "current email is:", lastCheckedEmail);
        }
      } catch (error) {
        console.error("Error validating email:", error);
      } finally {
        // Only update loading state if this is still the latest email check
        if (currentEmailCheck === lastCheckedEmail) {
          setIsValidatingEmail(false);
        }
      }
    } else if (isCurrentUserEmail) {
      // Clear any existing errors for the email if it belongs to the current user
      console.log("Using current user's email, clearing any errors");
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
      console.log("Email changed, will validate after debounce:", email);
      const timer = setTimeout(() => {
        handleEmailChange(email);
      }, 500); // Debounce email validation
      
      return () => clearTimeout(timer);
    } else {
      // Clear existing errors if email is empty
      setErrors((prev: FormErrors) => {
        const newErrors = { ...prev };
        if (newErrors.attorneyEmail) {
          delete newErrors.attorneyEmail;
        }
        return newErrors;
      });
      setAlreadyExists(false);
    }
  }, [email]);

  return { handleEmailChange, isValidatingEmail, alreadyExists };
};
