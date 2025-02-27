
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import CreateAccountPrompt from "@/components/auth/CreateAccountPrompt";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ShareButton } from "@/components/sharing/ShareButton";

const SubmissionConfirmation = () => {
  const [showCreateAccount, setShowCreateAccount] = useState(true);
  const [settlementData, setSettlementData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const temporaryId = new URLSearchParams(window.location.search).get("temporaryId");

  const handleClose = () => {
    setShowCreateAccount(false);
  };

  useEffect(() => {
    if (temporaryId) {
      fetchSettlementData();
    } else {
      setIsLoading(false);
    }
  }, [temporaryId]);

  const fetchSettlementData = async () => {
    try {
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('temporary_id', temporaryId)
        .single();
      
      if (error) throw error;
      
      setSettlementData(data);
    } catch (error) {
      console.error('Error fetching settlement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show create account prompt only for non-authenticated users with a temporaryId
  const shouldShowCreateAccount = !isAuthenticated && showCreateAccount && temporaryId;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-12">
        <div className="container">
          <Link to="/settlements">
            <Button variant="ghost" className="text-white mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leaderboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold font-display mb-4">Payment Successful!</h1>
          <p className="text-primary-200 max-w-2xl">
            Your settlement has been successfully submitted and is now live.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <div className="max-w-xl mx-auto">
          {shouldShowCreateAccount ? (
            <CreateAccountPrompt temporaryId={temporaryId} onClose={handleClose} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-8"
            >
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard className="h-8 w-8 text-primary-500" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-center">Thank You for Your Submission</h2>
              <p className="text-neutral-600 mb-8 text-center">
                Your settlement details have been received and are now live in our gallery.
              </p>

              {/* Share section */}
              {settlementData && (
                <div className="mb-8 p-6 bg-primary-50 rounded-lg">
                  <ShareButton
                    url={`${window.location.origin}/settlements/${settlementData.id}`}
                    title={`$${settlementData.amount.toLocaleString()} Settlement - ${settlementData.type}`}
                    amount={settlementData.amount.toString()}
                    caseType={settlementData.type}
                    variant="full"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <Link to="/settlements">
                  <Button className="w-full">View Settlement Gallery</Button>
                </Link>
                <Link to="/submit">
                  <Button variant="outline" className="w-full">
                    Submit Another Settlement
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmation;
