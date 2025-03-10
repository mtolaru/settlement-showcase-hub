
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PaymentRedirectProps {
  onRedirectAttempted: () => void;
}

export const PaymentRedirect: React.FC<PaymentRedirectProps> = ({ onRedirectAttempted }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [temporaryId, setTemporaryId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Extract and sanitize URL parameters
    const extractParams = () => {
      try {
        // Start by parsing the full search string
        const searchParams = location.search;
        console.log("Original search string:", searchParams);
        
        const params = new URLSearchParams(searchParams);
        
        // Extract parameters
        const session = params.get("session_id");
        let tempId = params.get("temporaryId");
        
        console.log("Extracted params:", { session_id: session, temporaryId: tempId });
        
        // Handle any malformed parameters
        if (tempId && tempId.includes('?')) {
          console.log("Sanitizing malformed temporaryId:", tempId);
          tempId = tempId.split('?')[0];
        }
        
        return { session, tempId };
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
        return { session: null, tempId: null };
      }
    };

    const { session, tempId } = extractParams();
    
    if (session) {
      setSessionId(session);
      console.log("Payment session detected:", session);
      localStorage.setItem('payment_session_id', session);
      
      if (tempId) {
        setTemporaryId(tempId);
        localStorage.setItem('temporary_id', tempId);
        console.log("Temporary ID found and saved:", tempId);
      }
      
      setRedirecting(true);
      
      // Build a clean confirmation URL with properly formatted parameters
      const queryParams = new URLSearchParams();
      if (session) queryParams.set("session_id", session);
      if (tempId) queryParams.set("temporaryId", tempId);
      
      const redirectUrl = `/confirmation?${queryParams.toString()}`;
      console.log("Redirecting to:", redirectUrl);
      
      // Short delay before redirect to ensure state updates
      setTimeout(() => {
        navigate(redirectUrl, { replace: true });
        
        toast({
          title: "Payment successful!",
          description: "Redirecting to confirmation page...",
        });
        
        onRedirectAttempted();
      }, 300);
    }
  }, [location.search, navigate, toast, onRedirectAttempted]);

  return (
    <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-center mb-4">
        <CheckCircle className="h-12 w-12 text-green-500" />
      </div>
      <h1 className="text-2xl font-bold mb-4 text-primary-600">Payment Successful!</h1>
      <p className="text-sm text-gray-500 mb-6">
        {redirecting ? "Redirecting you to the confirmation page..." : "Your payment has been processed."}
      </p>
      
      <div className="space-y-4">
        <Button 
          onClick={() => {
            // Create properly formatted URL parameters
            const queryParams = new URLSearchParams();
            if (sessionId) queryParams.set("session_id", sessionId);
            if (temporaryId) queryParams.set("temporaryId", temporaryId);
            
            navigate(`/confirmation?${queryParams.toString()}`);
          }}
          className="block w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
        >
          Go to Confirmation Now
        </Button>
        
        <Button 
          onClick={() => navigate("/")}
          variant="outline"
          className="block w-full"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};
