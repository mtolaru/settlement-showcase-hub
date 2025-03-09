
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { PaymentRedirect } from "@/components/payment/PaymentRedirect";
import { StandardNotFound } from "@/components/error/StandardNotFound";
import { NotFoundContainer } from "@/components/error/NotFoundContainer";

const NotFound = () => {
  const location = useLocation();
  const [isPaymentReturn, setIsPaymentReturn] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    // Check if this is a payment return by looking for session_id in the URL
    const params = new URLSearchParams(location.search);
    const session = params.get("session_id");
    
    if (session) {
      setIsPaymentReturn(true);
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
  }, [location.pathname, location.search, redirectAttempted]);

  const handleRedirectAttempted = () => {
    setRedirectAttempted(true);
  };

  return (
    <NotFoundContainer>
      {isPaymentReturn ? (
        <PaymentRedirect onRedirectAttempted={handleRedirectAttempted} />
      ) : (
        <StandardNotFound />
      )}
    </NotFoundContainer>
  );
};

export default NotFound;
