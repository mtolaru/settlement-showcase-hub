
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

    // If found in settlements, no need to check auth
    if (settlementData && settlementData.length > 0) {
      console.log("Email found in settlements table");
      return true;
    }

    // Check auth using signInWithOTP as a way to verify if user exists
    // This is a workaround since we can't directly query auth.users
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false // Just check if user exists, don't send email
        }
      });
      
      // If there's no error or the error doesn't contain "User not found", the email exists
      const emailExistsInAuth = !authError || (authError.message && !authError.message.includes("User not found"));
      
      if (authError && !authError.message.includes("User not found")) {
        console.error('Error checking email in auth:', authError);
      } else {
        console.log("Email check in auth result:", emailExistsInAuth ? "exists" : "not found");
      }
      
      return emailExistsInAuth;
    } catch (authCheckError) {
      console.error("Error during auth check:", authCheckError);
      return false;
    }
  } catch (err) {
    console.error('Exception in fallback email check:', err);
    return false;
  }
}
