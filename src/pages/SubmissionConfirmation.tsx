
import { useState } from "react";
import CreateAccountPrompt from "@/components/auth/CreateAccountPrompt";
import { LoadingState } from "@/components/submission/LoadingState";
import { ErrorState } from "@/components/submission/ErrorState";
import { ConfirmationHeader } from "@/components/submission/ConfirmationHeader";
import { SuccessCard } from "@/components/submission/SuccessCard";
import { useSettlementConfirmation } from "@/hooks/useSettlementConfirmation";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

const SubmissionConfirmation = () => {
  const [showCreateAccount, setShowCreateAccount] = useState(true);
  const { toast } = useToast();

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

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error finding settlement",
        description: "We couldn't locate your settlement data. If you've completed payment, please check your settlements later."
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return <LoadingState message="Retrieving your settlement details..." />;
  }

  if (error && !settlementData) {
    return <ErrorState error={error} />;
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
