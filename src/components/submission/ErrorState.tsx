
import { AlertTriangle, RefreshCw, Undo, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface ErrorStateProps {
  error: string;
  temporaryId?: string | null;
  onRecoveryAttempt?: () => void;
}

export const ErrorState = ({ error, temporaryId, onRecoveryAttempt }: ErrorStateProps) => {
  const [isRecovering, setIsRecovering] = useState(false);
  
  const handleRecoveryAttempt = () => {
    if (onRecoveryAttempt) {
      setIsRecovering(true);
      try {
        onRecoveryAttempt();
      } catch (error) {
        console.error("Error during recovery attempt:", error);
      } finally {
        // Reset after a timeout to allow for UI feedback
        setTimeout(() => setIsRecovering(false), 2000);
      }
    }
  };
  
  const handleManualRecoveryWithEmail = () => {
    const email = prompt("Please enter the email you used during submission:");
    if (email) {
      localStorage.setItem('recovery_email', email);
      window.location.href = `/confirmation${temporaryId ? `?temporaryId=${temporaryId}` : ''}`;
    }
  };
  
  return (
    <Card className="p-8 max-w-xl mx-auto text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900">
          Error Loading Settlement
        </h2>
        
        <p className="text-gray-600 mt-2">
          We encountered an issue retrieving your settlement data.
        </p>
        
        <div className="bg-red-50 border border-red-200 p-4 rounded-md w-full text-left">
          <p className="text-red-700 text-sm font-medium">Error details:</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          
          {temporaryId && (
            <p className="text-xs text-gray-500 mt-2">
              Settlement ID: {temporaryId}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-3 w-full mt-2">
          {onRecoveryAttempt && (
            <Button 
              onClick={handleRecoveryAttempt} 
              className="w-full flex items-center justify-center gap-2"
              disabled={isRecovering}
            >
              <RefreshCw className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
              {isRecovering ? 'Attempting Recovery...' : 'Attempt Recovery'}
            </Button>
          )}
          
          <Button
            variant="outline" 
            onClick={handleManualRecoveryWithEmail} 
            className="w-full flex items-center justify-center gap-2"
          >
            <Undo className="h-4 w-4" />
            Recover Using Email
          </Button>
          
          <Button
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          If this issue persists, please contact our support team for assistance.
        </p>
      </div>
    </Card>
  );
};
