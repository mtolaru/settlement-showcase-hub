
import { Loader2, ExternalLink } from "lucide-react";
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
import { Button } from "@/components/ui/button";

interface CancelSubscriptionDialogProps {
  isOpen: boolean;
  isCancelling: boolean;
  cancelError: string | null;
  portalUrl: string | null;
  isStripeManaged?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onOpenPortal: (url: string) => void;
}

const CancelSubscriptionDialog = ({
  isOpen,
  isCancelling,
  cancelError,
  portalUrl,
  isStripeManaged,
  onCancel,
  onConfirm,
  onOpenChange,
  onOpenPortal
}: CancelSubscriptionDialogProps) => {
  return (
    <AlertDialog 
      open={isOpen} 
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Warning: Subscription Management
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="font-medium text-red-600">
              Cancelling your subscription will result in losing access to your settlements data.
            </p>
            
            <p>
              You'll be redirected to the Stripe Customer Portal where you can:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Update your payment method</li>
              <li>View billing history</li>
              <li>Change your subscription plan</li>
              <li>Cancel your subscription (not recommended)</li>
            </ul>
            
            {cancelError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
                {cancelError}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Close
          </AlertDialogCancel>
          
          {portalUrl ? (
            <Button 
              onClick={() => onOpenPortal(portalUrl)}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              Go to Stripe Portal <ExternalLink className="h-4 w-4" />
            </Button>
          ) : (
            <AlertDialogAction 
              onClick={onConfirm}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Manage Subscription <ExternalLink className="h-4 w-4" /></>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelSubscriptionDialog;
