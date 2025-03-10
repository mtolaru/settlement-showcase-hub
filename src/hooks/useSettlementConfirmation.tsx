
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const useSettlementConfirmation = () => {
  const location = useLocation();
  const [settlementData, setSettlementData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const isProcessingRef = useRef(false);
  
  // Extract and sanitize URL parameters - memoize with useCallback  
  const extractUrlParams = useCallback(() => {
    try {
      const params = new URLSearchParams(location.search);
      let temporaryId = params.get("temporaryId");
      const sessionId = params.get("session_id");
      
      // Clean up any malformed temporaryId
      if (temporaryId && temporaryId.includes('?')) {
        console.log("Cleaning malformed temporaryId:", temporaryId);
        temporaryId = temporaryId.split('?')[0];
      }
      
      return { temporaryId, sessionId };
    } catch (error) {
      console.error("Error extracting URL parameters:", error);
      return { temporaryId: null, sessionId: null };
    }
  }, [location.search]);
  
  const { temporaryId: initialTemporaryId, sessionId } = extractUrlParams();
  const [temporaryId, setTemporaryId] = useState<string | null>(initialTemporaryId);

  // Store the IDs in localStorage for persistence - run only when these values change
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('payment_session_id', sessionId);
      console.log("Saved session_id to localStorage:", sessionId);
    }
    
    if (temporaryId) {
      localStorage.setItem('temporary_id', temporaryId);
      console.log("Saved temporaryId to localStorage:", temporaryId);
    } else if (!temporaryId && !sessionId) {
      // If no IDs in URL, try to recover from localStorage
      const storedTempId = localStorage.getItem('temporary_id');
      if (storedTempId) {
        console.log("Recovered temporaryId from localStorage:", storedTempId);
        setTemporaryId(storedTempId);
      }
    }
  }, [sessionId, temporaryId]);

  // Log URL parameters only when they change
  useEffect(() => {
    console.log("SubmissionConfirmation - URL parameters:", {
      temporaryId,
      sessionId,
      fullSearch: location.search,
      pathname: location.pathname,
      retryCount
    });
  }, [location, temporaryId, sessionId, retryCount]);

  // Fetch settlement by session ID with retry limit
  const fetchSettlementBySessionId = useCallback(async (sessionId: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    try {
      console.log(`Attempting to fetch settlement by session ID (attempt ${retryCount + 1}/${MAX_RETRIES}):`, sessionId);
      
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('temporary_id, user_id')
        .eq('payment_id', sessionId)
        .maybeSingle();
      
      if (subscriptionError) {
        console.error("Error fetching subscription:", subscriptionError);
      }
      
      if (subscriptionData?.temporary_id) {
        console.log("Found temporary_id from subscription:", subscriptionData.temporary_id);
        localStorage.setItem('temporary_id', subscriptionData.temporary_id);
        isProcessingRef.current = false;
        fetchSettlementData(subscriptionData.temporary_id);
        return;
      }
      
      if (sessionId.startsWith('cs_') && !subscriptionData) {
        console.log("No subscription found by payment_id, checking recent subscriptions");
        const { data: recentSubscriptions, error: recentError } = await supabase
          .from('subscriptions')
          .select('temporary_id, user_id')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (recentError) {
          console.error("Error fetching recent subscriptions:", recentError);
        }
        
        if (recentSubscriptions && recentSubscriptions.length > 0) {
          console.log("Found recent subscription:", recentSubscriptions[0]);
          localStorage.setItem('temporary_id', recentSubscriptions[0].temporary_id);
          isProcessingRef.current = false;
          fetchSettlementData(recentSubscriptions[0].temporary_id);
          return;
        }
      }
      
      // If we've reached here with no success and haven't exceeded retry limit
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`Settlement not found, scheduling retry #${retryCount + 1}/${MAX_RETRIES}`);
        isProcessingRef.current = false;
        // Wait 2 seconds before retrying
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000);
        return;
      }
      
      console.log(`Maximum retries (${MAX_RETRIES}) reached`);
      setIsLoading(false);
      setError("Could not find settlement data. Please try refreshing the page or contact support.");
      isProcessingRef.current = false;
    } catch (error) {
      console.error("Error in fetchSettlementBySessionId:", error);
      setIsLoading(false);
      setError("Could not find settlement data. Please try refreshing the page or contact support.");
      isProcessingRef.current = false;
    }
  }, [retryCount]);

  // Fetch settlement data with retry limit
  const fetchSettlementData = useCallback(async (tempId = temporaryId) => {
    if (!tempId || isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    try {
      console.log(`Fetching settlement data for temporaryId (attempt ${retryCount + 1}/${MAX_RETRIES}):`, tempId);
      
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('temporary_id', tempId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching settlement data:', error);
        throw error;
      }
      
      if (!data) {
        console.error('Settlement not found for temporaryId:', tempId);
        
        // Schedule a retry if we haven't exceeded retry limit
        if (retryCount < MAX_RETRIES - 1) {
          console.log(`Settlement not found, scheduling retry #${retryCount + 1}/${MAX_RETRIES}`);
          isProcessingRef.current = false;
          // Wait 2 seconds before retrying
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
          return;
        }
        
        console.log(`Maximum retries (${MAX_RETRIES}) reached`);
        throw new Error('Settlement not found');
      }

      console.log("Found settlement data:", data);
      setSettlementData(data);
      
      if (!data.payment_completed && !isUpdating) {
        setIsUpdating(true);
        
        const { error: updateError } = await supabase
          .from('settlements')
          .update({ payment_completed: true })
          .eq('temporary_id', tempId)
          .eq('payment_completed', false);
          
        if (updateError) {
          console.error("Error updating payment status:", updateError);
        } else {
          console.log("Updated payment status to completed");
          const { data: refreshedData } = await supabase
            .from('settlements')
            .select('*')
            .eq('temporary_id', tempId)
            .maybeSingle();
            
          if (refreshedData) {
            setSettlementData(refreshedData);
          }
        }
      }
    } catch (error: any) {
      console.error('Error in fetchSettlementData:', error);
      setError("Could not find settlement data. Please try refreshing the page or contact support.");
      
      toast({
        variant: "destructive",
        title: "Error finding your settlement",
        description: "We couldn't locate your settlement data. The payment may have been processed, but there was an issue connecting it to your submission."
      });
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
      isProcessingRef.current = false;
    }
  }, [temporaryId, toast, retryCount]);

  // Main effect to control fetching flow with proper dependencies
  useEffect(() => {
    if (sessionId && !temporaryId) {
      console.log("No temporaryId but found sessionId:", sessionId);
      fetchSettlementBySessionId(sessionId);
      return;
    }
    
    if (!temporaryId) {
      // Try to recover from localStorage
      const storedTempId = localStorage.getItem('temporary_id');
      if (storedTempId) {
        console.log("Recovered temporaryId from localStorage:", storedTempId);
        fetchSettlementData(storedTempId);
        return;
      }
      
      setIsLoading(false);
      setError("No settlement ID found in URL");
      return;
    }
    
    console.log("Attempting to fetch settlement with temporary ID:", temporaryId);
    fetchSettlementData();
  }, [temporaryId, sessionId, fetchSettlementData, fetchSettlementBySessionId, retryCount]);
  
  // Associate user with settlement - run only when these values change
  useEffect(() => {
    if (isAuthenticated && user && settlementData && temporaryId && !settlementData.user_id && !isUpdating) {
      associateUserWithSettlement();
    }
  }, [isAuthenticated, user, settlementData, temporaryId, isUpdating]);

  const associateUserWithSettlement = async () => {
    if (!user?.id || !temporaryId || isUpdating || isProcessingRef.current) return;
    
    try {
      setIsUpdating(true);
      isProcessingRef.current = true;
      console.log("Associating user ID with settlement:", user.id, temporaryId);
      
      const { error: updateError } = await supabase
        .from('settlements')
        .update({ user_id: user.id })
        .eq('temporary_id', temporaryId)
        .is('user_id', null); // Only update if user_id is null
        
      if (updateError) {
        console.error("Error associating user with settlement:", updateError);
      } else {
        console.log("Successfully associated user with settlement");
        fetchSettlementData();
      }
    } catch (error) {
      console.error("Error in associateUserWithSettlement:", error);
    } finally {
      setIsUpdating(false);
      isProcessingRef.current = false;
    }
  };

  const shouldShowCreateAccount = !isAuthenticated && settlementData && 
    (temporaryId || settlementData.temporary_id) && !settlementData.user_id;

  return {
    settlementData,
    isLoading,
    error,
    shouldShowCreateAccount,
    temporaryId: settlementData?.temporary_id || temporaryId,
  };
};
