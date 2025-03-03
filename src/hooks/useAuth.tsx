
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User, Session } from '@supabase/supabase-js';

interface AuthReturn {
  user: User | null;
  isLoading: boolean;
  checkAuth: () => Promise<Session | null>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

export const useAuth = (): AuthReturn => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get initial session and set up auth state listener
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("Initializing auth state");
        setIsLoading(true);
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw sessionError;
        }
        
        console.log("Current session:", session ? "Active" : "None");
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = useCallback(async () => {
    console.log("Checking auth status");
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error checking auth:", error);
    }
    
    if (!session) {
      navigate('/');
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to access this page.",
      });
    }
    return session;
  }, [navigate, toast]);

  const signOut = useCallback(async () => {
    try {
      console.log("Signing out");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error during sign out:", error);
        throw error;
      }
      
      setUser(null);
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again."
      });
    }
  }, [navigate, toast]);

  return { 
    user, 
    isLoading, 
    checkAuth,
    signOut,
    isAuthenticated: !!user 
  };
};
