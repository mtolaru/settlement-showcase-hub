
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const SettlementFormHeader: React.FC = () => {
  return (
    <div className="bg-primary-900 text-white py-12">
      <div className="container">
        <Link to="/">
          <Button variant="ghost" className="text-white mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
        <h1 className="text-4xl font-bold font-display mb-4">
          Submit Your Settlement
        </h1>
        <p className="text-primary-200 max-w-2xl">
          Share your success story and join the leading platform for personal
          injury settlements.
        </p>
      </div>
    </div>
  );
};
