
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const ConfirmationHeader: React.FC = () => {
  return (
    <div className="bg-primary-900 text-white py-12">
      <div className="container">
        <Link to="/settlements">
          <Button variant="ghost" className="text-white mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leaderboard
          </Button>
        </Link>
        <h1 className="text-4xl font-bold font-display mb-4">Payment Successful!</h1>
        <p className="text-primary-200 max-w-2xl">
          Your settlement has been successfully submitted and is now live.
        </p>
      </div>
    </div>
  );
};
