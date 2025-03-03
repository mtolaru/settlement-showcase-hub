
import React from "react";
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
  portalUrl: string | null;
  isStripeManaged?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  onOpenPortal: () => void;
}

const CancelSubscriptionDialog = ({
  isOpen,
  isCancelling,
  cancelError,
  portalUrl,
  isStripeManaged = false,
  onCancel,
  onConfirm,
  onOpenChange,
  onOpenPortal
}: CancelSubscriptionDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isStripeManaged ? "Manage Your Subscription" : "Cancel Subscription"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isStripeManaged ? (
              "You'll be redirected to the Stripe Customer Portal where you can manage your subscription settings, including cancellation."
            ) : (
              "Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period."
            )}
            {cancelError && (
              <div className="mt-2 text-red-600 text-sm font-medium">
                Error: {cancelError}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isCancelling}>
            Close
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={isStripeManaged ? onOpenPortal : onConfirm}
            disabled={isCancelling}
            className={isStripeManaged ? "bg-primary-600" : "bg-red-600"}
          >
            {isCancelling ? (
              "Processing..."
            ) : isStripeManaged ? (
              "Go to Customer Portal"
            ) : (
              "Yes, Cancel Subscription"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelSubscriptionDialog;
