
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPaymentReturn, setIsPaymentReturn] = useState(false);
  const [temporaryId, setTemporaryId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [redirectTimeout, setRedirectTimeout] = useState<number | null>(null);

  useEffect(() => {
    // Log all URL params for debugging
    console.log("NotFound: URL parameters:", {
      search: location.search,
      pathname: location.pathname,
      fullURL: window.location.href
    });
    
    // Check if this is a payment return by looking for session_id parameter
    const params = new URLSearchParams(location.search);
    const session = params.get("session_id");
    const tempId = params.get("temporaryId");
    
    if (session) {
      setSessionId(session);
      console.log("Payment session detected:", session);
      setIsPaymentReturn(true);
      
      if (!redirectAttempted) {
        setRedirectAttempted(true);
        setRedirecting(true);
        
        if (tempId) {
          setTemporaryId(tempId);
          console.log("Temporary ID found:", tempId);
          
          // Set a short timeout to allow the app to recognize the route change
          const timeout = window.setTimeout(() => {
            // Automatically redirect to confirmation page
            console.log("Redirecting to confirmation page with session and temporaryId");
            navigate(`/confirmation?session_id=${encodeURIComponent(session)}&temporaryId=${encodeURIComponent(tempId)}`, { replace: true });
            
            toast({
              title: "Payment successful!",
              description: "Redirecting to confirmation page...",
            });
          }, 300); // Reduced timeout for faster redirect
          
          setRedirectTimeout(timeout);
        } else {
          // Try to redirect with just session ID
          const timeout = window.setTimeout(() => {
            console.log("Redirecting to confirmation page with session only");
            navigate(`/confirmation?session_id=${encodeURIComponent(session)}`, { replace: true });
            
            toast({
              title: "Payment processed",
              description: "Redirecting to confirmation page...",
            });
          }, 300); // Reduced timeout for faster redirect
          
          setRedirectTimeout(timeout);
        }
      }
    }

    // If not a payment return, log regular 404 error
    if (!session && !redirectAttempted) {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        location.pathname,
        "Search params:",
        location.search,
        "Full URL:",
        window.location.href
      );
    }
    
    // Clean up timeout if component unmounts
    return () => {
      if (redirectTimeout) {
        window.clearTimeout(redirectTimeout);
      }
    };
  }, [location.pathname, location.search, navigate, redirectAttempted, toast]);

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
            {redirecting ? "Redirecting you to the confirmation page..." : "Your payment has been processed."}
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => navigate(`/confirmation?session_id=${encodeURIComponent(sessionId || '')}&temporaryId=${encodeURIComponent(temporaryId || '')}`)}
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
