
import SubmitSettlementPage from "./settlement/SubmitSettlementPage";
import { useEffect } from "react";

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
  }, []); // Empty dependency array to run only once
  
  return (
    <div className="bg-white">
      <SubmitSettlementPage />
      {/* Remove duplicate Toaster since it's already included in SubmitSettlementPage */}
    </div>
  );
};

export default SubmitSettlement;
