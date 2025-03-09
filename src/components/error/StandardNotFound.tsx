
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export const StandardNotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
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
  );
};
