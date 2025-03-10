
import SubmitSettlementPage from "./settlement/SubmitSettlementPage";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const SubmitSettlement = () => {
  const [searchParams] = useSearchParams();
  const [temporaryIdRestored, setTemporaryIdRestored] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    console.log("SubmitSettlement page mounted");
    
    // Check for temporaryId in URL params
    const temporaryId = searchParams.get('temporaryId');
    if (temporaryId) {
      console.log(`Found temporaryId in URL: ${temporaryId}, storing to localStorage`);
      localStorage.setItem('temporary_id', temporaryId);
      setTemporaryIdRestored(true);
      
      toast({
        title: "Session Restored",
        description: "We've restored your previous session.",
      });
    }
    
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
