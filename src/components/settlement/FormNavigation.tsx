
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
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
  const [buttonText, setButtonText] = useState("Next Step");

  useEffect(() => {
    // Reset button text when loading/submitting state changes
    if (!isLoading && !isSubmitting && !isValidating) {
      setButtonText("Next Step");
    }
  }, [isLoading, isSubmitting, isValidating]);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    onBack();
  };

  // Create a debounced version of the next handler to prevent multiple clicks
  const debouncedNextHandler = React.useCallback(
    debounce(async (button: HTMLButtonElement) => {
      try {
        setIsValidating(true);
        setButtonText("Validating...");
        console.log("Calling onNext function");
        const success = await Promise.resolve(onNext());
        
        if (!success) {
          console.log("Validation failed");
          
          // Show toast notification when validation fails
          toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Mandatory information is missing. Please review the form and try again.",
          });
          
          // Reset button only if validation failed and not in other loading states
          if (!isLoading && !isSubmitting) {
            setButtonText("Next Step");
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
        setButtonText("Next Step");
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
    button.disabled = true;
    setButtonText("Validating...");
    
    console.log("Next button clicked, calling debounced handler");
    debouncedNextHandler(button);
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
            {(isValidating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {buttonText} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
