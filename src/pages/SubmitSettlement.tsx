
import SubmitSettlementPage from "./settlement/SubmitSettlementPage";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";

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
    <div className="bg-white">
      <SubmitSettlementPage />
      <Toaster />
    </div>
  );
};

export default SubmitSettlement;
