
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import debounce from "lodash.debounce";

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
  const [isValidating, setIsValidating] = useState(false);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    onBack();
  };

  // Create a debounced version of the next handler to prevent multiple clicks
  const debouncedNextHandler = React.useCallback(
    debounce(async (originalText: string, button: HTMLButtonElement) => {
      try {
        setIsValidating(true);
        console.log("Calling onNext function");
        const success = await Promise.resolve(onNext());
        
        if (!success) {
          console.log("Validation failed, showing toast");
          toast({
            variant: "destructive",
            title: "Please Check Form",
            description: "Please fill in all required fields correctly.",
          });
          // Reset button only if validation failed
          if (!isLoading && !isSubmitting) {
            button.innerText = originalText;
            button.disabled = false;
          }
        }
      } catch (error) {
        console.error("Error in form navigation:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
        });
        button.innerText = originalText;
        button.disabled = false;
      } finally {
        setIsValidating(false);
      }
    }, 300),
    [onNext, toast, isLoading, isSubmitting]
  );

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isValidating || isLoading || isSubmitting) {
      console.log("Already processing, ignoring click");
      return;
    }
    
    // Show loading state while validating
    const button = e.currentTarget as HTMLButtonElement;
    const originalText = button.innerText;
    button.innerText = "Validating...";
    button.disabled = true;
    
    console.log("Next button clicked, calling debounced handler");
    debouncedNextHandler(originalText, button);
  };

  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-neutral-100">
      {step > 1 && (
        <Button 
          variant="ghost" 
          onClick={handleBack}
          type="button"
          disabled={isValidating || isLoading || isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      )}
      {step < 3 && (
        <div className="ml-auto">
          <Button 
            onClick={handleNext}
            className="bg-primary-500 hover:bg-primary-600"
            disabled={isValidating || isLoading || isSubmitting}
            type="button"
          >
            {isValidating ? "Validating..." : (isLoading || isSubmitting ? "Processing..." : "Next Step")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
