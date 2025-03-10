
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { stringParam, updateObj, safeGet } from "@/utils/dbTypeHelpers";

export const useSettlementConfirmation = () => {
  const location = useLocation();
  const [settlementData, setSettlementData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  // Parse URL parameters
  const params = new URLSearchParams(location.search);
  let temporaryId = params.get("temporaryId");
  const sessionId = params.get("session_id");
  
  // Clean up malformed temporaryId if it contains a question mark
  if (temporaryId && temporaryId.includes('?')) {
    console.log("Cleaning malformed temporaryId:", temporaryId);
    temporaryId = temporaryId.split('?')[0];
    console.log("Cleaned temporaryId:", temporaryId);
  }

  useEffect(() => {
    console.log("SubmissionConfirmation - URL parameters:", {
      temporaryId,
      sessionId,
      fullSearch: location.search,
      pathname: location.pathname
    });
  }, [location, temporaryId, sessionId]);

  useEffect(() => {
    if (sessionId && !temporaryId) {
      console.log("No temporaryId but found sessionId:", sessionId);
      fetchSettlementBySessionId(sessionId);
      return;
    }
    
    if (!temporaryId) {
      setIsLoading(false);
      setError("No settlement ID found in URL");
      return;
    }
    
    console.log("Attempting to fetch settlement with temporary ID:", temporaryId);
    fetchSettlementData();
  }, [temporaryId, sessionId]);
  
  useEffect(() => {
    if (isAuthenticated && user && settlementData && temporaryId && !settlementData.user_id) {
      associateUserWithSettlement();
    }
  }, [isAuthenticated, user, settlementData, temporaryId]);

  const associateUserWithSettlement = async () => {
    if (!user?.id || !temporaryId || isUpdating) return;
    
    try {
      setIsUpdating(true);
      console.log("Associating user ID with settlement:", user.id, temporaryId);
      
      // Use the safer updateObj helper
      const { error: updateError } = await supabase
        .from('settlements')
        .update(updateObj({ user_id: user.id }))
        .eq('temporary_id', stringParam(temporaryId))
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
    }
  };

  const fetchSettlementBySessionId = async (sessionId: string) => {
    try {
      console.log("Attempting to fetch settlement by session ID:", sessionId);
      
      // First try to find the subscription with this payment ID
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('temporary_id, user_id')
        .eq('payment_id', stringParam(sessionId))
        .maybeSingle();
      
      if (subscriptionError) {
        console.error("Error fetching subscription:", subscriptionError);
      }
      
      // If we found a temporaryId, use it to fetch the settlement
      const tempId = safeGet(subscriptionData as any, 'temporary_id', null);
      if (tempId) {
        console.log("Found temporary_id from subscription:", tempId);
        fetchSettlementData(tempId);
        return;
      }
      
      // As a fallback for Stripe checkout sessions, check recent subscriptions
      if (sessionId.startsWith('cs_') && !subscriptionData) {
        console.log("No subscription found by payment_id, checking recent subscriptions");
        const { data: recentSubscriptions, error: recentError } = await supabase
          .from('subscriptions')
          .select('temporary_id, user_id')
          .order('starts_at', { ascending: false })
          .limit(3);
          
        if (recentError) {
          console.error("Error fetching recent subscriptions:", recentError);
        }
        
        if (recentSubscriptions && recentSubscriptions.length > 0) {
          console.log("Found recent subscriptions:", recentSubscriptions);
          
          for (const sub of recentSubscriptions) {
            const tempIdFromRecent = safeGet(sub as any, 'temporary_id', null);
            if (tempIdFromRecent) {
              console.log("Trying recent subscription temporary_id:", tempIdFromRecent);
              const settlementFound = await checkSettlementExists(tempIdFromRecent);
              if (settlementFound) {
                fetchSettlementData(tempIdFromRecent);
                return;
              }
            }
          }
        }
      }
      
      // If we got here, we couldn't find a valid settlement
      setIsLoading(false);
      setError("Could not find settlement data. Please try refreshing the page or contact support.");
    } catch (error) {
      console.error("Error in fetchSettlementBySessionId:", error);
      setIsLoading(false);
      setError("Could not find settlement data. Please try refreshing the page or contact support.");
    }
  };

  // Helper function to check if a settlement exists for a temporary ID
  const checkSettlementExists = async (tempId: string) => {
    try {
      const { data, error } = await supabase
        .from('settlements')
        .select('id')
        .eq('temporary_id', stringParam(tempId))
        .maybeSingle();
        
      if (error) {
        console.error('Error checking settlement:', error);
        return false;
      }
      
      return !!data;
    } catch (e) {
      console.error('Error in checkSettlementExists:', e);
      return false;
    }
  };

  const fetchSettlementData = async (tempId = temporaryId) => {
    if (!tempId) return;
    
    try {
      console.log("Fetching settlement data for temporaryId:", tempId);
      
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('temporary_id', stringParam(tempId))
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching settlement data:', error);
        throw error;
      }
      
      if (!data) {
        console.error('Settlement not found for temporaryId:', tempId);
        throw new Error('Settlement not found');
      }

      console.log("Found settlement data:", data);
      setSettlementData(data);
      
      // Check if payment is completed and update if needed
      const paymentCompleted = safeGet(data as any, 'payment_completed', false);
      if (!paymentCompleted && !isUpdating) {
        setIsUpdating(true);
        
        const { error: updateError } = await supabase
          .from('settlements')
          .update(updateObj({ payment_completed: true }))
          .eq('temporary_id', stringParam(tempId))
          .eq('payment_completed', false);
          
        if (updateError) {
          console.error("Error updating payment status:", updateError);
        } else {
          console.log("Updated payment status to completed");
          const { data: refreshedData } = await supabase
            .from('settlements')
            .select('*')
            .eq('temporary_id', stringParam(tempId))
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
    }
  };

  const shouldShowCreateAccount = !isAuthenticated && settlementData && 
    (temporaryId || safeGet(settlementData as any, 'temporary_id', null)) && 
    !safeGet(settlementData as any, 'user_id', null);

  return {
    settlementData,
    isLoading,
    error,
    shouldShowCreateAccount,
    temporaryId: safeGet(settlementData as any, 'temporary_id', temporaryId) || temporaryId,
  };
};
