
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
    // Use the Edge Function for checking email existence
    const { data, error } = await supabase.functions.invoke('check-email', {
      body: { email: normalizedEmail }
    });
    
    if (error) {
      console.error('Edge function error:', error);
      return fallbackEmailCheck(normalizedEmail);
    }
    
    console.log("Edge function response:", data);
    return data.exists === true;
  } catch (err) {
    console.error('Exception checking email with edge function:', err);
    return fallbackEmailCheck(normalizedEmail);
  }
};

// Fallback method using direct database queries
async function fallbackEmailCheck(normalizedEmail: string): Promise<boolean> {
  try {
    console.log("Using fallback email check method");
    
    // Check settlements table
    const { data: settlementData, error: settlementError } = await supabase
      .from('settlements')
      .select('attorney_email')
      .ilike('attorney_email', normalizedEmail)
      .limit(1);

    if (settlementError) {
      console.error('Error checking email in settlements:', settlementError);
    }

    // Check auth using OTP method as a fallback
    const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false // Just check if user exists, don't send email
      }
    });
    
    // If there's no error with OTP check or the error doesn't contain "User not found", the email exists
    const emailExistsInAuth = !authError || (authError.message && !authError.message.includes("User not found"));
    
    if (authError && !authError.message.includes("User not found")) {
      console.error('Error checking email in auth:', authError);
    }
    
    // Email exists if found in either settlements or auth
    const emailExists = !!settlementData?.length || emailExistsInAuth;
    
    console.log("Email verification results (fallback):", {
      emailExists,
      inSettlements: !!settlementData?.length,
      inAuth: emailExistsInAuth,
      authErrorMsg: authError?.message
    });
    
    return emailExists;
  } catch (err) {
    console.error('Exception in fallback email check:', err);
    return false;
  }
}
