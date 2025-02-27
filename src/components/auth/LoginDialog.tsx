
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

export function LoginDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Prevent body scroll when dialog is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setIsLoading(false);
    setResetSent(false);
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    resetForm();
    setIsForgotPasswordMode(false);
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      throw new Error("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      throw new Error("Password must contain at least one number");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isForgotPasswordMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        
        if (error) throw error;
        
        setResetSent(true);
        toast({
          title: "Password reset email sent",
          description: "Please check your email to reset your password.",
        });
      } else if (isRegisterMode) {
        validatePassword(password);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        toast({
          title: "Registration successful!",
          description: "Please check your email to verify your account.",
        });
        handleDialogClose();
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Welcome back!",
        });
        
        // Redirect to manage page if not already there
        if (location.pathname !== "/manage") {
          navigate("/manage");
        }
        handleDialogClose();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setIsForgotPasswordMode(false);
    setResetSent(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <span className="text-sm text-neutral-600 hover:text-primary-900 cursor-pointer">
          Login
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-none shadow-lg">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-semibold text-primary-900">
            {isForgotPasswordMode 
              ? "Reset Password" 
              : isRegisterMode 
                ? "Create Account" 
                : "Login"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {isForgotPasswordMode ? (
            <>
              {!resetSent ? (
                <>
                  <div>
                    <p className="text-sm text-neutral-600 mb-4">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Reset Link...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="mb-4 text-primary-600">
                    <Mail className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Check Your Email</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    We've sent a password reset link to <strong>{email}</strong>. 
                    Please check your email to reset your password.
                  </p>
                </div>
              )}
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="text-sm flex items-center justify-center mx-auto text-neutral-600 hover:text-primary-900"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-white"
                      required
                      minLength={8}
                    />
                  </div>
                  {isRegisterMode && (
                    <p className="text-xs text-neutral-500 mt-2">
                      Password must be at least 8 characters long and contain uppercase, lowercase, and numbers
                    </p>
                  )}
                </div>
              </div>
              
              {!isRegisterMode && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordMode(true)}
                    className="text-sm text-neutral-600 hover:text-primary-900"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isRegisterMode ? "Creating Account..." : "Logging in..."}
                  </>
                ) : (
                  isRegisterMode ? "Create Account" : "Login"
                )}
              </Button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    resetForm();
                  }}
                  className="text-sm text-neutral-600 hover:text-primary-900"
                >
                  {isRegisterMode
                    ? "Already have an account? Login"
                    : "Don't have an account? Register"}
                </button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
