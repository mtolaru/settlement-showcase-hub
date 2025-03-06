
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

  useEffect(() => {
    console.log("Setting up auth state handling");
    
    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial auth session:", session?.user?.id);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      console.log("Session user:", session?.user?.id);
      
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account.",
    });
  };

  return { 
    user, 
    isLoading, 
    checkAuth,
    signOut,
    isAuthenticated: !!user 
  };
};
