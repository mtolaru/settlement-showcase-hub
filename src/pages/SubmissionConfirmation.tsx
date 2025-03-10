
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import CreateAccountPrompt from "@/components/auth/CreateAccountPrompt";
import { LoadingState } from "@/components/submission/LoadingState";
import { ErrorState } from "@/components/submission/ErrorState";
import { ConfirmationHeader } from "@/components/submission/ConfirmationHeader";
import { SuccessCard } from "@/components/submission/SuccessCard";
import { useSettlementConfirmation } from "@/hooks/useSettlementConfirmation";
import { useToast } from "@/components/ui/use-toast";

const SubmissionConfirmation = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [showCreateAccount, setShowCreateAccount] = useState(true);
  
  // Log URL parameters for debugging
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sessionId = searchParams.get("session_id");
    const tempId = searchParams.get("temporaryId");
    
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

  if (isLoading) {
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
