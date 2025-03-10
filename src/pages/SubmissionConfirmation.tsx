
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
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  
  // Try to recover from common Stripe rate limit issues
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sessionId = searchParams.get("session_id");
    const tempId = searchParams.get("temporaryId");
    const recoveryEmail = localStorage.getItem('recovery_email');
    
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
      recoveryEmail,
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
        setIsRecoveryInProgress(true);
        
        // Try to recover with check-payment-status function
        const attemptPaymentStatusRecovery = async () => {
          try {
            console.log("Attempting to recover missing temporaryId from session:", sessionId);
            
            const { data, error } = await supabase.functions.invoke('check-payment-status', {
              body: { session_id: sessionId, email: recoveryEmail }
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
                return true;
              }
            } else {
              console.log("Payment not confirmed:", data);
            }
            return false;
          } catch (err) {
            console.error("Error in payment status recovery attempt:", err);
            return false;
          }
        };
        
        // Try to recover using the new webhook-handler function
        const attemptWebhookRecovery = async () => {
          try {
            console.log("Attempting recovery with webhook-handler function");
            
            const { data: webhookData, error: webhookError } = await supabase.functions.invoke('webhook-handler', {
              body: { 
                type: "check-session", 
                session_id: sessionId,
                email: recoveryEmail
              }
            });
            
            if (webhookError) {
              console.error("Error in webhook recovery:", webhookError);
            } else if (webhookData?.success) {
              console.log("Successfully recovered settlement via webhook handler:", webhookData);
              
              if (webhookData.temporaryId) {
                localStorage.setItem('temporary_id', webhookData.temporaryId);
                
                const url = new URL(window.location.href);
                url.searchParams.set('temporaryId', webhookData.temporaryId);
                window.location.href = url.toString();
                return true;
              }
            }
            return false;
          } catch (webhookErr) {
            console.error("Error in webhook recovery attempt:", webhookErr);
            return false;
          }
        };
        
        // As a fallback, try to use the fix-settlement endpoint
        const attemptFixSettlementRecovery = async () => {
          try {
            console.log("Attempting fallback settlement recovery with fix-settlement function");
            
            const { data: fixData, error: fixError } = await supabase.functions.invoke('fix-settlement', {
              body: { 
                sessionId,
                email: recoveryEmail
              }
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
              return true;
            }
            return false;
          } catch (fallbackError) {
            console.error("Error in fallback settlement recovery:", fallbackError);
            return false;
          }
        };
        
        // Chain recovery methods with async/await to try each in sequence
        const performRecovery = async () => {
          setRecoveryAttempts(prev => prev + 1);
          
          try {
            // First try payment status recovery
            const paymentStatusSuccess = await attemptPaymentStatusRecovery();
            if (paymentStatusSuccess) return;
            
            // If that fails, try webhook recovery
            const webhookSuccess = await attemptWebhookRecovery();
            if (webhookSuccess) return;
            
            // If both fail, try fix-settlement
            const fixSettlementSuccess = await attemptFixSettlementRecovery();
            if (fixSettlementSuccess) return;
            
            // If all automatic methods fail and we haven't tried too many times, retry
            if (recoveryAttempts < 2) {
              console.log(`All recovery methods failed. Scheduling retry attempt ${recoveryAttempts + 1}/3`);
              setTimeout(() => {
                setIsRecoveryInProgress(false);
                // This will trigger another recovery attempt via the useEffect
              }, 3000);
            } else {
              console.log("Exhausted all recovery attempts. User will need to try manual recovery.");
              setIsRecoveryInProgress(false);
            }
          } catch (error) {
            console.error("Error in recovery chain:", error);
            setIsRecoveryInProgress(false);
          }
        };
        
        performRecovery();
      }
    }
  }, [location, toast, isRecoveryInProgress, recoveryAttempts]);
  
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
        setIsRecoveryInProgress(false);
        return;
      }
      
      localStorage.setItem('recovery_email', email || '');
      
      console.log("Attempting manual recovery with:", { sessionId, tempId, email });
      
      // Try all recovery methods in sequence
      
      // 1. Try the webhook-handler function first (newest)
      try {
        const { data: webhookData, error: webhookError } = await supabase.functions.invoke('webhook-handler', {
          body: { 
            type: "manual-recovery", 
            session_id: sessionId,
            temporary_id: tempId,
            email
          }
        });
        
        if (webhookError) {
          console.error("Error in webhook manual recovery:", webhookError);
        } else if (webhookData?.success) {
          console.log("Successfully recovered via webhook handler:", webhookData);
          toast({
            title: "Settlement recovered",
            description: "We've located your settlement details.",
          });
          
          if (webhookData.temporaryId) {
            localStorage.setItem('temporary_id', webhookData.temporaryId);
            
            // Force reload with the recovered parameters
            const url = new URL(window.location.href);
            url.searchParams.set('temporaryId', webhookData.temporaryId);
            window.location.href = url.toString();
            return;
          }
        }
      } catch (webhookErr) {
        console.error("Error in webhook manual recovery attempt:", webhookErr);
      }
      
      // 2. Try the fix-settlement function as fallback
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
          description: "We couldn't recover your settlement. Please try again with different information.",
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
