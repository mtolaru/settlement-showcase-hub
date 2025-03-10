import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CreateAccountPromptProps {
  temporaryId: string;
  onClose: () => void;
}

const CreateAccountPrompt = ({ temporaryId, onClose }: CreateAccountPromptProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load attorney email from the settlement to pre-populate
  useEffect(() => {
    const fetchSettlementEmail = async () => {
      if (!temporaryId) return;
      
      try {
        const { data, error } = await supabase
          .from('settlements')
          .select('attorney_email')
          .eq('temporary_id', temporaryId)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching attorney email:", error);
          return;
        }
        
        if (data?.attorney_email) {
          console.log("Pre-populating email from settlement:", data.attorney_email);
          setEmail(data.attorney_email);
          
          // Check if this email already exists in auth
          const { data: userData, error: userError } = await supabase.auth.signInWithOtp({
            email: data.attorney_email,
            options: {
              shouldCreateUser: false // Just check if user exists, don't send email
            }
          });
          
          if (!userError && userData?.user) {
            // This is a sign that the email is already registered
            setIsExistingAccount(true);
          } else {
            // Assume new user if there's an error with this API call
            setIsExistingAccount(false);
          }
        }
      } catch (error) {
        console.error("Error in fetchSettlementEmail:", error);
      }
    };
    
    fetchSettlementEmail();
  }, [temporaryId]);

  const getRedirectUrl = (path: string) => {
    // Get the current origin (protocol + hostname + port)
    const origin = window.location.origin;
    return `${origin}${path}`;
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(""); // Clear any previous errors

    try {
      console.log("Creating account for temporaryId:", temporaryId);
      
      // Check if email exists by attempting to sign in with magic link (but not sending the email)
      const { error: checkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      });
      
      // If there's no error, the email exists; if there's an error about user not found, it doesn't exist
      const emailExists = !checkError;
      
      if (emailExists) {
        console.log("Email already exists, attempting sign in");
        // If email exists, try to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          console.error("Sign in error:", signInError);
          setErrorMessage("Incorrect password. Please use the correct password for this existing account.");
          setIsLoading(false);
          return;
        }
        
        // If sign in successful, update the settlement with the user ID
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user) {
          await updateSettlementWithUserId(session.session.user.id);
          toast({
            title: "Signed in successfully!",
            description: "You have been logged in to your existing account.",
          });
          navigate("/manage");
          onClose();
        }
      } else {
        console.log("Email does not exist, creating new account");
        
        // Use dynamic redirect URL
        const signUpRedirectUrl = getRedirectUrl('/auth/callback');
        console.log(`Using signup redirect URL: ${signUpRedirectUrl}`);
        
        // Email doesn't exist, create a new account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              // Store the temporary ID in the user metadata
              temporaryId: temporaryId
            },
            emailRedirectTo: signUpRedirectUrl
          }
        });

        if (signUpError) {
          console.error("Sign up error:", signUpError);
          setErrorMessage(signUpError.message || "An unexpected error occurred. Please try again.");
          setIsLoading(false);
          return;
        }

        if (signUpData.user) {
          await updateSettlementWithUserId(signUpData.user.id);
          
          if (signUpData.session) {
            // User is automatically signed in
            toast({
              title: "Account created successfully!",
              description: "You have been automatically logged in.",
            });
            navigate("/manage");
          } else {
            // User needs to verify email
            toast({
              title: "Almost there!",
              description: "Please check your email to verify your account. Once verified, you'll be able to access your settlements.",
            });
          }
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Account creation error:', error);
      setErrorMessage(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateSettlementWithUserId = async (userId: string) => {
    try {
      console.log(`Linking settlement ${temporaryId} to user ${userId}`);
      
      // Update the settlement with the user ID
      const { error: updateError } = await supabase
        .from('settlements')
        .update({ user_id: userId })
        .eq('temporary_id', temporaryId);

      if (updateError) {
        console.error("Error updating settlement:", updateError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to link your settlement to your account. Please contact support.",
        });
      } else {
        console.log("Settlement updated with user_id");
        toast({
          title: "Settlement Linked",
          description: "Your settlement has been successfully linked to your account.",
        });
      }
      
      // Also try to link any other settlements with the same email but no user_id
      if (email) {
        console.log(`Checking for additional settlements with email ${email}`);
        const { data: emailSettlements, error: emailError } = await supabase
          .from('settlements')
          .update({ user_id: userId })
          .is('user_id', null)
          .eq('attorney_email', email)
          .select('id');
          
        if (emailError) {
          console.error("Error linking additional settlements by email:", emailError);
        } else if (emailSettlements && emailSettlements.length > 0) {
          console.log(`Linked ${emailSettlements.length} additional settlement(s) by email`);
          toast({
            title: "Additional Settlements Linked",
            description: `${emailSettlements.length} additional settlement(s) have been linked to your account.`,
          });
        }
      }
      
      // Also update any subscription record with the same temporary_id
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({ user_id: userId })
        .eq('temporary_id', temporaryId);

      if (subscriptionError) {
        console.error("Error updating subscription:", subscriptionError);
      } else {
        console.log("Subscription updated with user_id");
      }
    } catch (error) {
      console.error("Error in updateSettlementWithUserId:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary-900 mb-4">
          {isExistingAccount ? "Sign In to Your Account" : "Create Your Account"}
        </h2>
        <p className="text-neutral-600">
          {isExistingAccount 
            ? "Please sign in to access your settlement and submit additional cases." 
            : "Please create an account to access your settlement and submit additional cases."}
        </p>
      </div>

      <form onSubmit={handleCreateAccount} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              placeholder={isExistingAccount ? "Enter your password" : "Create a password"}
              required
              minLength={6}
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">Password must be at least 6 characters</p>
        </div>

        {errorMessage && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-100">
            {errorMessage}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 text-lg py-6"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : isExistingAccount ? "Sign In" : "Create Account"} {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
        </Button>

        <div className="text-center">
          <p className="text-sm text-neutral-500">
            {isExistingAccount 
              ? "Signing in is required to access your settlements." 
              : "Creating an account is required to access your settlements."}
          </p>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateAccountPrompt;
