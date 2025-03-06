
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
        }
      } catch (error) {
        console.error("Error in fetchSettlementEmail:", error);
      }
    };
    
    fetchSettlementEmail();
  }, [temporaryId]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(""); // Clear any previous errors

    try {
      console.log("Creating account for temporaryId:", temporaryId);
      
      // First, try to sign in with the provided credentials
      // This handles the case where the user has already registered
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!signInError && signInData.user) {
        console.log("User signed in successfully:", signInData.user.id);
        
        // Update the settlement with the user ID
        const { error: updateError } = await supabase
          .from('settlements')
          .update({ user_id: signInData.user.id })
          .eq('temporary_id', temporaryId);

        if (updateError) {
          console.error("Error updating settlement:", updateError);
        } else {
          console.log("Settlement updated with user_id");
        }
        
        toast({
          title: "Signed in successfully!",
          description: "You have been logged in to your existing account.",
        });
        
        navigate("/manage");
        onClose();
        return;
      }
      
      // If sign in failed, it could be because:
      // 1. User doesn't exist - try to sign up
      // 2. Password is incorrect - show error
      
      if (signInError) {
        console.log("Sign in error:", signInError.message);
        
        // If the error is about incorrect password, show specific message
        if (signInError.message?.toLowerCase().includes('invalid login credentials')) {
          setErrorMessage("Incorrect password. If you already have an account, please use the correct password.");
          setIsLoading(false);
          return;
        }
      }
      
      // Try to sign up (this will fail if email is already registered)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            temporaryId
          }
        }
      });

      if (signUpError) {
        // Email already registered but password was incorrect
        if (signUpError.message?.toLowerCase().includes('email already registered')) {
          setErrorMessage("This email is already registered. Please use the correct password to sign in.");
        } else {
          setErrorMessage(signUpError.message || "An unexpected error occurred. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      if (signUpData.user) {
        console.log("User created successfully:", signUpData.user.id);
        
        try {
          // Update the settlement with the user ID
          const { error: updateError } = await supabase
            .from('settlements')
            .update({ user_id: signUpData.user.id })
            .eq('temporary_id', temporaryId);

          if (updateError) {
            console.error("Error updating settlement:", updateError);
          } else {
            console.log("Settlement updated with user_id");
          }
          
          // Also update any subscription record with the same temporary_id
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .update({ user_id: signUpData.user.id })
            .eq('temporary_id', temporaryId);

          if (subscriptionError) {
            console.error("Error updating subscription:", subscriptionError);
          } else {
            console.log("Subscription updated with user_id");
          }
        } catch (error) {
          console.error("Error in database updates after signup:", error);
        }

        if (signUpData.session) {
          // User is automatically signed in
          toast({
            title: "Account created successfully!",
            description: "You have been automatically logged in.",
          });

          navigate("/manage");
          onClose();
        } else {
          // User needs to verify email
          toast({
            title: "Almost there!",
            description: "Please check your email to verify your account. Once verified, you'll be able to access your settlements.",
          });
          
          // Close the account creation prompt even if email verification is pending
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary-900 mb-4">Create Your Account</h2>
        <p className="text-neutral-600">
          Please create an account to access your settlement and submit additional cases.
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
              placeholder="Create a password"
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
          {isLoading ? "Processing..." : "Create Account"} {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
        </Button>

        <div className="text-center">
          <p className="text-sm text-neutral-500">
            Creating an account is required to access your settlements.
          </p>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateAccountPrompt;
