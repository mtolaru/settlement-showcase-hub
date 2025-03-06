
import { supabase } from "@/integrations/supabase/client";

export const verifyEmail = async (email: string, userEmail: string | undefined | null): Promise<boolean> => {
  console.log("verifyEmail called for email:", email, "current user email:", userEmail);
  
  // If the email being verified is the same as the current user's email,
  // we should always return false (not existing) to allow the user to use their own email
  if (userEmail === email) {
    console.log("Email being verified belongs to current user:", email);
    return false;
  }
  
  try {
    console.log("Checking if email exists in settlements:", email);
    const { data, error } = await supabase
      .from('settlements')
      .select('attorney_email')
      .eq('attorney_email', email)
      .maybeSingle();

    if (error) {
      console.error('Error checking email:', error);
      return false;
    }

    const emailExists = !!data;
    console.log("Email exists check result:", emailExists, "for email:", email);
    return emailExists;
  } catch (err) {
    console.error('Exception checking email:', err);
    return false;
  }
};
