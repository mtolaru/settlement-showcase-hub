
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";

interface ErrorStateProps {
  error: string;
  temporaryId?: string | null;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, temporaryId }) => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const checkSettlementStatus = async () => {
    try {
      setIsChecking(true);
      
      // Try to get temporaryId from props or localStorage
      const tempId = temporaryId || localStorage.getItem('temporary_id');
      const sessionId = localStorage.getItem('payment_session_id');
      
      console.log("Checking settlement status:", { 
        tempId, 
        sessionId,
        location: window.location.href 
      });
      
      if (!tempId && !sessionId) {
        toast({
          variant: "destructive",
          title: "Missing settlement reference",
          description: "We couldn't find your settlement reference. Please contact support."
        });
        return;
      }

      // First try by temporary ID
      if (tempId) {
        const { data: tempData, error: tempError } = await supabase
          .from('settlements')
          .select('*')
          .eq('temporary_id', tempId)
          .maybeSingle();
          
        if (tempError) {
          console.error("Error checking by temporaryId:", tempError);
        }
        
        if (tempData) {
          console.log("Found settlement by temporaryId:", tempData);
          toast({
            title: "Settlement found!",
            description: "Redirecting to your settlement..."
          });
          
          // Refresh the page to trigger confirmation flow
          setTimeout(() => window.location.reload(), 1500);
          return;
        }
      }
      
      // Then try by session ID
      if (sessionId) {
        console.log("Checking by session ID:", sessionId);
        
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('temporary_id')
          .eq('payment_id', sessionId)
          .maybeSingle();
          
        if (subError) {
          console.error("Error checking by sessionId:", subError);
        }
        
        if (subData?.temporary_id) {
          console.log("Found subscription by sessionId:", subData);
          
          // Now look up the settlement
          const { data: settlementData } = await supabase
            .from('settlements')
            .select('*')
            .eq('temporary_id', subData.temporary_id)
            .maybeSingle();
            
          if (settlementData) {
            console.log("Found settlement via subscription:", settlementData);
            
            // Store the temporaryId in localStorage and reload
            localStorage.setItem('temporary_id', subData.temporary_id);
            
            toast({
              title: "Settlement found!",
              description: "Redirecting to your settlement..."
            });
            
            setTimeout(() => window.location.reload(), 1500);
            return;
          }
        }
      }
      
      // If we get here, we didn't find a settlement
      setRetryCount(prev => prev + 1);
      
      if (retryCount >= 2) {
        toast({
          variant: "destructive",
          title: "Settlement not found",
          description: "We couldn't locate your settlement after multiple attempts. The payment may have been processed, but there was an issue finding your submission."
        });
      } else {
        toast({
          title: "Still processing",
          description: "Your settlement may still be processing. Please try again in a moment."
        });
      }
      
    } catch (err) {
      console.error("Exception checking settlement status:", err);
      toast({
        variant: "destructive",
        title: "Error checking status",
        description: "There was a technical problem checking your settlement status."
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md border border-neutral-200">
        <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
        <p className="text-neutral-600 mb-4">{error}</p>
        <p className="text-sm text-neutral-500 mb-6">
          If you've completed payment, your settlement has been recorded, but we're having trouble displaying it.
          Please try refreshing this page or checking your settlements later.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={checkSettlementStatus} 
            variant="secondary" 
            className="w-full flex items-center justify-center"
            disabled={isChecking}
          >
            {isChecking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking Status...
              </>
            ) : (
              <>Check Settlement Status</>
            )}
          </Button>
          
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
};
