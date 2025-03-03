
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormNavigationProps {
  step: number;
  onNext: () => boolean | Promise<boolean>;
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
  const { toast } = useToast();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    onBack();
  };

  const handleNext = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      // Call onNext and capture its return value
      const success = await Promise.resolve(onNext());
      
      // If validation failed, show toast message
      if (success === false) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please fill in all required fields correctly.",
        });
      }
    } catch (error) {
      console.error("Error in form navigation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-neutral-100">
      {step > 1 && (
        <Button 
          variant="ghost" 
          onClick={handleBack}
          type="button"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      )}
      {step < 3 && (
        <div className="ml-auto">
          <Button 
            onClick={handleNext}
            className="bg-primary-500 hover:bg-primary-600"
            disabled={isLoading || isSubmitting}
            type="button"
          >
            {isLoading || isSubmitting ? "Processing..." : "Next Step"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
