
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
    if (!temporaryId) {
      // Try to retrieve from localStorage if not provided as prop
      const storedTemporaryId = localStorage.getItem('temporary_id');
      if (!storedTemporaryId) {
        toast({
          variant: "destructive",
          title: "Missing settlement reference",
          description: "We couldn't find your settlement reference. Please contact support."
        });
        return;
      }
    }

    try {
      setIsChecking(true);
      const tempId = temporaryId || localStorage.getItem('temporary_id');
      console.log("Checking settlement status for temporaryId:", tempId);
      console.log("Current origin:", window.location.origin);
      
      const { data, error: fetchError } = await supabase
        .from('settlements')
        .select('*')
        .eq('temporary_id', tempId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking settlement status:", fetchError);
        toast({
          variant: "destructive",
          title: "Error checking status",
          description: "There was a problem checking your settlement status. Please try again."
        });
        return;
      }

      if (data) {
        console.log("Settlement found:", data);
        toast({
          title: "Settlement found!",
          description: "Redirecting to your settlement..."
        });
        
        // Refresh the page after a short delay to trigger the confirmation flow again
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setRetryCount(prev => prev + 1);
        console.log("Settlement not found, retry count:", retryCount + 1);
        
        if (retryCount >= 2) {
          toast({
            variant: "destructive",
            title: "Settlement not found",
            description: "We couldn't locate your settlement. It may still be processing or there may be an issue."
          });
        } else {
          toast({
            title: "Still processing",
            description: "Your settlement may still be processing. Please try again in a moment."
          });
        }
      }
    } catch (err) {
      console.error("Exception checking settlement status:", err);
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
