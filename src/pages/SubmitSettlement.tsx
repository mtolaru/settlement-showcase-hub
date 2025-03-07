
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { LoadingState } from "@/components/settlement/LoadingState";

// Lazy load the SubmitSettlementPage component
const SubmitSettlementPage = lazy(() => import("./settlement/SubmitSettlementPage"));

const SubmitSettlement = () => {
  useEffect(() => {
    console.log("SubmitSettlement page mounted");
    
    // Add console error handler to catch any rendering issues
    const originalConsoleError = console.error;
    console.error = (...args) => {
      console.log("Console error caught:", ...args);
      originalConsoleError(...args);
    };
    
    // Add additional validator for values in session storage
    const formData = sessionStorage.getItem('settlementFormData');
    if (formData) {
      console.log("Found form data in session storage");
    }
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  return (
    <>
      <Suspense fallback={<LoadingState message="Loading settlement form..." />}>
        <SubmitSettlementPage />
      </Suspense>
      <Toaster />
    </>
  );
};

export default SubmitSettlement;
