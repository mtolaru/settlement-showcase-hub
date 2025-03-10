
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
      if (sessionId && !tempId && !isRecoveryInProgress) {
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
              
              // IMPORTANT: Use the recovered temporaryId if available
              if (data.temporaryId) {
                localStorage.setItem('temporary_id', data.temporaryId);
                console.log("Recovered temporaryId from payment status check:", data.temporaryId);
                
                // Force reload with the recovered parameters to properly show the confirmation
                const url = new URL(window.location.href);
                url.searchParams.set('temporaryId', data.temporaryId);
                window.location.href = url.toString();
                return;
              }
            } else {
              console.log("Payment not confirmed:", data);
              
              // As a fallback, try to use the fix-settlement endpoint
              try {
                console.log("Attempting fallback settlement recovery with fix-settlement function");
                const { data: fixData, error: fixError } = await supabase.functions.invoke('fix-settlement', {
                  body: { sessionId }
                });
                
                if (fixError) {
                  console.error("Error in settlement recovery:", fixError);
                } else if (fixData?.success && fixData?.settlement?.temporaryId) {
                  console.log("Successfully recovered settlement:", fixData);
                  toast({
                    title: "Settlement recovered",
                    description: "We've located your settlement details.",
                  });
                  
                  localStorage.setItem('temporary_id', fixData.settlement.temporaryId);
                  
                  // Force reload with the recovered parameters
                  const url = new URL(window.location.href);
                  url.searchParams.set('temporaryId', fixData.settlement.temporaryId);
                  window.location.href = url.toString();
                  return;
                }
              } catch (fallbackError) {
                console.error("Error in fallback settlement recovery:", fallbackError);
              }
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
  }, [location, toast, isRecoveryInProgress]);
  
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

  // Add manual recovery option for when automatic recovery fails
  const handleManualRecovery = async () => {
    try {
      setIsRecoveryInProgress(true);
      const sessionId = localStorage.getItem('payment_session_id');
      const tempId = localStorage.getItem('temporary_id');
      const email = prompt("Please enter the email you used during submission:");
      
      if (!sessionId && !tempId && !email) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "We need either a session ID, temporary ID, or your email to recover your settlement.",
        });
        return;
      }
      
      console.log("Attempting manual recovery with:", { sessionId, tempId, email });
      
      const { data, error } = await supabase.functions.invoke('fix-settlement', {
        body: { 
          sessionId, 
          temporaryId: tempId,
          email 
        }
      });
      
      if (error) {
        console.error("Error in manual recovery:", error);
        toast({
          variant: "destructive",
          title: "Recovery failed",
          description: "We couldn't recover your settlement. Please contact support.",
        });
      } else if (data?.success) {
        console.log("Manual recovery successful:", data);
        toast({
          title: "Settlement recovered",
          description: "We've located your settlement details.",
        });
        
        if (data.settlement?.temporaryId) {
          localStorage.setItem('temporary_id', data.settlement.temporaryId);
          
          // Force reload with the recovered parameters
          const url = new URL(window.location.href);
          url.searchParams.set('temporaryId', data.settlement.temporaryId);
          window.location.href = url.toString();
        }
      } else {
        console.log("Manual recovery failed:", data);
        toast({
          variant: "destructive",
          title: "Recovery unsuccessful",
          description: "We couldn't find your settlement with the provided information.",
        });
      }
    } catch (err) {
      console.error("Error in manual recovery attempt:", err);
      toast({
        variant: "destructive",
        title: "Recovery error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsRecoveryInProgress(false);
    }
  };

  if (isLoading || isRecoveryInProgress) {
    return <LoadingState message="Retrieving your settlement details..." />;
  }

  if (error && !settlementData) {
    return <ErrorState 
      error={error} 
      temporaryId={temporaryId} 
      onRecoveryAttempt={handleManualRecovery} 
    />;
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
