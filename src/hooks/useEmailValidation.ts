
import { useEffect } from "react";
import { verifyEmail } from "@/utils/emailUtils";
import { useAuth } from "@/hooks/useAuth";
import { FormErrors } from "@/types/settlementForm";

export const useEmailValidation = (
  email: string,
  isValidEmail: (email: string) => boolean,
  setErrors: (errors: FormErrors | ((prev: FormErrors) => FormErrors)) => void
) => {
  const { user } = useAuth();

  const handleEmailChange = async (email: string) => {
    if (email && !(user?.email === email)) {
      // First validate email format before checking if it exists
      if (!isValidEmail(email)) {
        setErrors((prev: FormErrors) => ({
          ...prev,
          attorneyEmail: "Please enter a valid email address"
        }));
        return;
      }

      const emailExists = await verifyEmail(email, user?.email);
      if (emailExists) {
        setErrors((prev: FormErrors) => ({
          ...prev,
          attorneyEmail: "This email is already associated with settlements. Please log in or use a different email."
        }));
      }
    }
  };

  useEffect(() => {
    if (email) {
      handleEmailChange(email);
    }
  }, [email]);

  return { handleEmailChange };
};
