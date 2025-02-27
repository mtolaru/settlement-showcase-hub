
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CreateAccountPrompt from "@/components/auth/CreateAccountPrompt";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ShareButton } from "@/components/sharing/ShareButton";
import { useToast } from "@/components/ui/use-toast";

const SubmissionConfirmation = () => {
  const [showCreateAccount, setShowCreateAccount] = useState(true);
  const [settlementData, setSettlementData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Get temporaryId from URL parameters
  const params = new URLSearchParams(window.location.search);
  const temporaryId = params.get("temporaryId");

  const handleClose = () => {
    setShowCreateAccount(false);
  };

  useEffect(() => {
    if (!temporaryId) {
      setIsLoading(false);
      setError("No settlement ID found in URL");
      return;
    }
    
    console.log("Attempting to fetch settlement with temporary ID:", temporaryId);
    fetchSettlementData();
  }, [temporaryId]);

  const fetchSettlementData = async () => {
    if (!temporaryId) return;
    
    try {
      console.log("Fetching settlement data for temporaryId:", temporaryId);
      
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('temporary_id', temporaryId)
        .single();
      
      if (error) {
        console.error('Error fetching settlement data:', error);
        throw error;
      }
      
      if (!data) {
        console.error('Settlement not found for temporaryId:', temporaryId);
        throw new Error('Settlement not found');
      }

      console.log("Found settlement data:", data);
      setSettlementData(data);
      
      // Check if payment has been completed
      if (!data.payment_completed) {
        // Try to update payment status
        const { error: updateError } = await supabase
          .from('settlements')
          .update({ payment_completed: true })
          .eq('temporary_id', temporaryId);
          
        if (updateError) {
          console.error("Error updating payment status:", updateError);
        } else {
          console.log("Updated payment status to completed");
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
    }
  };

  // Show create account prompt only for non-authenticated users with a temporaryId
  const shouldShowCreateAccount = !isAuthenticated && showCreateAccount && temporaryId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-neutral-600">Fetching your settlement details...</p>
        </div>
      </div>
    );
  }

  if (error && !settlementData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-neutral-600 mb-4">{error}</p>
          <p className="text-sm text-neutral-500 mb-6">
            If you've completed payment, your settlement has been recorded, but we're having trouble displaying it.
            Please try refreshing this page or checking your settlements later.
          </p>
          <div className="space-y-3">
            <Link to="/submit">
              <Button className="w-full">Return to Submit Page</Button>
            </Link>
            <Link to="/settlements">
              <Button variant="outline" className="w-full">View Settlement Gallery</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
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
