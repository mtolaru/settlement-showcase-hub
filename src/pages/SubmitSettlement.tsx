
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
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  return <SubmitSettlementPage />;
};

export default SubmitSettlement;
