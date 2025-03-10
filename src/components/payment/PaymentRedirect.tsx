
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
    // Start by parsing the full search string to detect any malformed URLs
    const searchParams = location.search;
    console.log("Original search string:", searchParams);
    
    // Handle malformed URLs with multiple question marks
    let sanitizedSearch = searchParams;
    if (searchParams.split('?').length > 2) {
      console.log("Detected malformed URL with multiple question marks");
      // Replace all occurrences after the first ? with &
      sanitizedSearch = searchParams.replace(/\?(?!.*=$)/g, '&');
      console.log("Sanitized search string:", sanitizedSearch);
    }
    
    // Create URLSearchParams from sanitized string
    const params = new URLSearchParams(sanitizedSearch);
    
    // Extract parameters
    const session = params.get("session_id");
    let tempId = params.get("temporaryId");
    
    // Further sanitize temporaryId if it contains a question mark
    if (tempId && tempId.includes('?')) {
      console.log("Detected malformed temporaryId:", tempId);
      tempId = tempId.split('?')[0];
      console.log("Sanitized temporaryId:", tempId);
    }
    
    if (session) {
      setSessionId(session);
      console.log("Payment session detected:", session);
      localStorage.setItem('payment_session_id', session);
      
      setRedirecting(true);
      
      // Build a proper URL with correctly formatted parameters
      let redirectUrl = '/confirmation';
      const queryParams = [];
      
      if (session) queryParams.push(`session_id=${encodeURIComponent(session)}`);
      if (tempId) {
        queryParams.push(`temporaryId=${encodeURIComponent(tempId)}`);
        setTemporaryId(tempId);
        localStorage.setItem('temporary_id', tempId);
        console.log("Temporary ID found and saved to localStorage:", tempId);
      }
      
      if (queryParams.length > 0) {
        redirectUrl += `?${queryParams.join('&')}`;
      }
      
      console.log("Redirecting to:", redirectUrl);
      console.log("Current URL:", window.location.href);
      console.log("Current location origin:", window.location.origin);
      
      // Short delay before redirect to ensure state updates
      setTimeout(() => {
        navigate(redirectUrl, { replace: true });
        
        toast({
          title: "Payment successful!",
          description: "Redirecting to confirmation page...",
        });
      }, 300);
      
      onRedirectAttempted();
    }
  }, [location.pathname, location.search, navigate, toast, onRedirectAttempted]);

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
        {/* Use proper URL construction with encoded parameters */}
        <Button 
          onClick={() => {
            const params = [];
            if (sessionId) params.push(`session_id=${encodeURIComponent(sessionId)}`);
            if (temporaryId) params.push(`temporaryId=${encodeURIComponent(temporaryId)}`);
            const queryString = params.length > 0 ? `?${params.join('&')}` : '';
            navigate(`/confirmation${queryString}`);
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
