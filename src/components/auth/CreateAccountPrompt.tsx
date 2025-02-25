
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateAccountPromptProps {
  temporaryId: string;
  onClose: () => void;
}

const CreateAccountPrompt = ({ temporaryId, onClose }: CreateAccountPromptProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Update the settlement and subscription with the new user_id
        const { error: updateError } = await supabase
          .from('settlements')
          .update({ user_id: authData.user.id })
          .eq('temporary_id', temporaryId);

        if (updateError) throw updateError;

        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .update({ user_id: authData.user.id })
          .eq('temporary_id', temporaryId);

        if (subscriptionError) throw subscriptionError;

        toast({
          title: "Account created successfully!",
          description: "You can now manage your settlements and upload more without additional payment.",
        });

        onClose();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-auto"
    >
      <h2 className="text-2xl font-bold mb-4">Create Your Account</h2>
      <p className="text-neutral-600 mb-6">
        Create an account to manage your settlements and upload more without additional payment.
      </p>

      <form onSubmit={handleCreateAccount} className="space-y-4">
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
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          Create Account <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onClose}
        >
          Maybe Later
        </Button>
      </form>
    </motion.div>
  );
};

export default CreateAccountPrompt;
