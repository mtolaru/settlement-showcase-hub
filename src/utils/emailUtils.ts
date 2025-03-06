
import { supabase } from "@/integrations/supabase/client";

export const verifyEmail = async (email: string, userEmail: string | undefined | null): Promise<boolean> => {
  // If the email being verified is the same as the current user's email,
  // we should always return false (not existing) to allow the user to use their own email
  if (userEmail === email) {
    console.log("Email being verified belongs to current user:", email);
    return false;
  }
  
  if (!email) {
    console.log("Empty email provided to verifyEmail");
    return false;
  }
  
  // Normalize the email to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase().trim();
  console.log("Checking if email exists in database (normalized):", normalizedEmail);
  
  try {
    // First check settlements table
    console.log("Checking settlements table for email:", normalizedEmail);
    const { data: settlementData, error: settlementError } = await supabase
      .from('settlements')
      .select('attorney_email')
      .ilike('attorney_email', normalizedEmail)
      .maybeSingle();

    if (settlementError) {
      console.error('Error checking email in settlements:', settlementError);
    }

    // Also check auth.users table for existing users (this is a less direct way)
    console.log("Checking if user exists with this email");
    const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false // Just check if user exists, don't send email
      }
    });
    
    // If there's no error with OTP check, the email exists in auth
    const emailExistsInAuth = !authError || (authError.message && !authError.message.includes("User not found"));
    
    if (authError && !authError.message.includes("User not found")) {
      console.error('Error checking email in auth:', authError);
    }
    
    // Email exists if found in either settlements or auth
    const emailExists = !!settlementData || emailExistsInAuth;
    
    console.log("Email verification results:", {
      emailExists,
      inSettlements: !!settlementData,
      inAuth: emailExistsInAuth,
      authErrorMsg: authError?.message
    });
    
    return emailExists;
  } catch (err) {
    console.error('Exception checking email:', err);
    return false;
  }
};
