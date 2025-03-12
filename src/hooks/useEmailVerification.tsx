
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useEmailVerification = (setEmailStatus: React.Dispatch<React.SetStateAction<{ isValidating: boolean; alreadyExists: boolean }>>) => {
  const [verifyEmail, setVerifyEmail] = useState(false);

  const handleVerifyEmail = async (email: string) => {
    if (!email) return;
    
    setEmailStatus(prev => ({ ...prev, isValidating: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('check-email', {
        body: { email }
      });

      if (error) {
        console.error('Error verifying email:', error);
        setEmailStatus({ isValidating: false, alreadyExists: false });
        return false;
      }

      const exists = data?.exists || false;
      setEmailStatus({ isValidating: false, alreadyExists: exists });
      setVerifyEmail(true);
      return !exists;
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailStatus({ isValidating: false, alreadyExists: false });
      return false;
    }
  };

  return {
    handleVerifyEmail,
    verifyEmail
  };
};
