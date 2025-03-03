
import { useEffect } from "react";
import { verifyEmail } from "@/utils/emailUtils";
import { useAuth } from "@/hooks/useAuth";

export const useEmailValidation = (
  email: string,
  isValidEmail: (email: string) => boolean,
  setErrors: (errors: Record<string, string | undefined>) => void
) => {
  const { user } = useAuth();

  const handleEmailChange = async (email: string) => {
    if (email && !(user?.email === email)) {
      // First validate email format before checking if it exists
      if (!isValidEmail(email)) {
        setErrors(prev => ({
          ...prev,
          attorneyEmail: "Please enter a valid email address"
        }));
        return;
      }

      const emailExists = await verifyEmail(email, user?.email);
      if (emailExists) {
        setErrors(prev => ({
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
