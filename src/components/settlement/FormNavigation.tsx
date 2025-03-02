
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface FormNavigationProps {
  step: number;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  isSubmitting: boolean;
}

export const FormNavigation: React.FC<FormNavigationProps> = ({
  step,
  onNext,
  onBack,
  isLoading,
  isSubmitting
}) => {
  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-neutral-100">
      {step > 1 && (
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      )}
      {step < 3 && (
        <div className="ml-auto">
          <Button 
            onClick={onNext} 
            className="bg-primary-500 hover:bg-primary-600"
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? "Processing..." : "Next Step"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
