
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ErrorStateProps {
  error: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md border border-neutral-200">
        <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
        <p className="text-neutral-600 mb-4">{error}</p>
        <p className="text-sm text-neutral-500 mb-6">
          If you've completed payment, your settlement has been recorded, but we're having trouble displaying it.
          Please try refreshing this page or checking your settlements later.
        </p>
        <div className="space-y-3">
          <Link to="/submit">
            <Button className="w-full">Return to Submit Page</Button>
          </Link>
          <Link to="/settlements">
            <Button variant="outline" className="w-full">View Settlement Gallery</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
