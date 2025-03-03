
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CancelSubscriptionDialogProps {
  isOpen: boolean;
  isCancelling: boolean;
  cancelError: string | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

const CancelSubscriptionDialog = ({
  isOpen,
  isCancelling,
  cancelError,
  onCancel,
  onConfirm,
  onOpenChange
}: CancelSubscriptionDialogProps) => {
  return (
    <AlertDialog 
      open={isOpen} 
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
          <AlertDialogDescription>
            Your subscription will remain active until the end of your current billing period. 
            After that, your settlements will be delisted from search results and other lawyers will rank above you in search results.
            {cancelError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
                {cancelError}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Keep Subscription</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600"
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Cancel Subscription"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelSubscriptionDialog;
