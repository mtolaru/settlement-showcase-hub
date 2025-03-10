
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorStateProps {
  error: string;
  temporaryId?: string | null;
  onRecoveryAttempt?: () => void;
}

export const ErrorState = ({ error, temporaryId, onRecoveryAttempt }: ErrorStateProps) => {
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
        
        {onRecoveryAttempt && (
          <Button 
            onClick={onRecoveryAttempt} 
            className="mt-4 w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Attempt Recovery
          </Button>
        )}
        
        <Button
          variant="outline" 
          onClick={() => window.location.href = '/'}
          className="mt-2 w-full"
        >
          Return to Home
        </Button>
        
        <p className="text-sm text-gray-500 mt-4">
          If this issue persists, please contact our support team for assistance.
        </p>
      </div>
    </Card>
  );
};
