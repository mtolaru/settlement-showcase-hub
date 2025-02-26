
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  useEffect(() => {
    checkAuth();
  }, []);

  return { checkAuth };
};
