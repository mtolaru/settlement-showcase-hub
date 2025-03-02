
import { supabase } from "@/integrations/supabase/client";

export const verifyEmail = async (email: string, userEmail: string | undefined | null): Promise<boolean> => {
  if (userEmail === email) {
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
