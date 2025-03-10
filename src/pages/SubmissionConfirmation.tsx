
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import CreateAccountPrompt from "@/components/auth/CreateAccountPrompt";
import { LoadingState } from "@/components/submission/LoadingState";
import { ErrorState } from "@/components/submission/ErrorState";
import { ConfirmationHeader } from "@/components/submission/ConfirmationHeader";
import { SuccessCard } from "@/components/submission/SuccessCard";
import { useSettlementConfirmation } from "@/hooks/useSettlementConfirmation";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SubmissionConfirmation = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [showCreateAccount, setShowCreateAccount] = useState(true);
  const [isRecoveryInProgress, setIsRecoveryInProgress] = useState(false);
  
  // Try to recover from common Stripe rate limit issues
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sessionId = searchParams.get("session_id");
    const tempId = searchParams.get("temporaryId");
    
    // If we have a session_id or temporaryId, store it for potential recovery
    if (sessionId) {
      localStorage.setItem('payment_session_id', sessionId);
      console.log("Stored session_id in localStorage:", sessionId);
    }
    
    if (tempId) {
      localStorage.setItem('temporary_id', tempId);
      console.log("Stored temporaryId in localStorage:", tempId);
    }
    
    // Log URL parameters for debugging
    console.log("SubmissionConfirmation - URL params:", { 
      sessionId, 
      tempId, 
      fullSearch: location.search,
      pathname: location.pathname,
      origin: window.location.origin
    });
    
    // Show toast when params are present to confirm data is being processed
    if (sessionId || tempId) {
      toast({
        title: "Processing your settlement",
        description: "Retrieving your settlement details...",
      });
      
      // If we have a session_id but there's no temporaryId, try to check the payment status
      if (sessionId && !tempId) {
        const attemptRecovery = async () => {
          try {
            setIsRecoveryInProgress(true);
            console.log("Attempting to recover missing temporaryId from session:", sessionId);
            
            const { data, error } = await supabase.functions.invoke('check-payment-status', {
              body: { session_id: sessionId }
            });
            
            if (error) {
              console.error("Error checking payment status:", error);
            } else if (data?.success) {
              console.log("Successfully recovered payment info:", data);
              toast({
                title: "Payment confirmed",
                description: "We've verified your payment status.",
              });
              // Force reload to get updated params
              window.location.reload();
            } else {
              console.log("Payment not confirmed:", data);
            }
          } catch (err) {
            console.error("Error in recovery attempt:", err);
          } finally {
            setIsRecoveryInProgress(false);
          }
        };
        
        attemptRecovery();
      }
    }
  }, [location, toast]);
  
  const {
    settlementData,
    isLoading,
    error,
    shouldShowCreateAccount,
    temporaryId
  } = useSettlementConfirmation();

  const handleClose = () => {
    setShowCreateAccount(false);
  };

  if (isLoading || isRecoveryInProgress) {
    return <LoadingState message="Retrieving your settlement details..." />;
  }

  if (error && !settlementData) {
    return <ErrorState error={error} temporaryId={temporaryId} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <ConfirmationHeader />

      <div className="container py-12">
        <div className="max-w-xl mx-auto">
          {shouldShowCreateAccount && showCreateAccount ? (
            <CreateAccountPrompt 
              temporaryId={temporaryId!} 
              onClose={handleClose} 
            />
          ) : (
            <SuccessCard settlementData={settlementData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmation;
