
import { useEffect, useState } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      try {
        console.log("Initializing auth session");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session:", session ? `User ID: ${session.user.id}` : "No session");
        
        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        // Ensure user is set to null on error
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Check for URL parameters that indicate an auth action (like password reset)
    const handleAuthRedirects = () => {
      const url = new URL(window.location.href);
      const errorParam = url.searchParams.get('error');
      const errorDescriptionParam = url.searchParams.get('error_description');
      
      if (errorParam && errorDescriptionParam) {
        console.error(`Auth redirect error: ${errorParam} - ${errorDescriptionParam}`);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: errorDescriptionParam,
        });
      }
      
      // Handle password reset success
      const typeParam = url.searchParams.get('type');
      if (typeParam === 'recovery') {
        console.log('Password reset flow detected');
        // Could handle this flow specifically
      }
    };
    
    handleAuthRedirects();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event);
      console.log("New session:", session ? `User ID: ${session.user.id}` : "No session");
      
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/');
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to access this page.",
      });
    }
    return session;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      console.log("Sign out completed");
      setUser(null);
      setIsAuthenticated(false);
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "Please try again.",
      });
    }
  };

  return { 
    user, 
    isLoading, 
    checkAuth,
    signOut,
    isAuthenticated
  };
};
