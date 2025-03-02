
import React from "react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Checking subscription status..." 
}) => {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        <p className="text-neutral-600">{message}</p>
      </div>
    </div>
  );
};
