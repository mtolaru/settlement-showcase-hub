
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPaymentReturn, setIsPaymentReturn] = useState(false);
  const [temporaryId, setTemporaryId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check if this is a payment return by looking for session_id parameter
    const params = new URLSearchParams(location.search);
    const session = params.get("session_id");
    const tempId = params.get("temporaryId");
    
    if (session) {
      setSessionId(session);
      console.log("Payment session detected:", session);
      setIsPaymentReturn(true);
      
      if (tempId) {
        setTemporaryId(tempId);
        console.log("Temporary ID found:", tempId);
        
        // Automatically redirect to confirmation page after a short delay
        const timer = setTimeout(() => {
          navigate(`/confirmation?session_id=${session}&temporaryId=${tempId}`);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }

    // If not a payment return, log regular 404 error
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      "Search params:",
      location.search,
      "Full URL:",
      window.location.href
    );
  }, [location.pathname, location.search, navigate]);

  // If this is a payment return, show a specific message and auto-redirect
  if (isPaymentReturn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-primary-600">Payment Successful!</h1>
          <p className="text-sm text-gray-500 mb-6">
            Your payment has been processed. Redirecting you to the confirmation page...
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => navigate(`/confirmation?session_id=${sessionId}${temporaryId ? `&temporaryId=${temporaryId}` : ''}`)}
              className="block w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
            >
              Go to Confirmation Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-primary-600">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <p className="text-sm text-gray-500 mb-6">
          The page you are looking for might have been removed, had its name changed, 
          or is temporarily unavailable. If you were completing a payment, don't worry - 
          your payment was likely processed successfully.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate("/")}
            className="block w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
          >
            Return to Home
          </Button>
          <Button 
            onClick={() => navigate("/confirmation")}
            variant="outline"
            className="block w-full py-2 px-4 border border-primary-600 text-primary-600 hover:bg-primary-50 rounded transition-colors"
          >
            Go to Payment Confirmation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
