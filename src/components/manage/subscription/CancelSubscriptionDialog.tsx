
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
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
  isStripeManaged?: boolean;
  isCanceled?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

const CancelSubscriptionDialog = ({
  isOpen,
  isCancelling,
  cancelError,
  isStripeManaged,
  isCanceled,
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
          <AlertDialogTitle>
            {isCanceled ? 'Reactivate Subscription' : 'Subscription Management'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {isCanceled ? (
              <>
                <p className="font-medium text-black">
                  You'll be redirected to the Stripe Customer Portal where you can reactivate your subscription.
                </p>
                
                <p>
                  Reactivating your subscription will:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Restore continuous access to your settlement data</li>
                  <li>Keep your settlements publicly visible</li>
                  <li>Resume your billing at the end of the current period</li>
                </ul>
                
                <p className="font-medium text-green-600 mt-4">
                  Note: Reactivating before your subscription ends will prevent any loss of access to your data.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-black">
                  You'll be redirected to the Stripe Customer Portal where you can manage your subscription.
                </p>
                
                <p>
                  In the Stripe portal, you can:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Update your payment method</li>
                  <li>View billing history</li>
                  <li>Change your subscription plan</li>
                  <li>Cancel your subscription</li>
                </ul>
                
                <p className="font-medium text-red-600 mt-4">
                  Note: Cancelling your subscription will result in losing access to your settlements data after the current billing period.
                </p>
              </>
            )}
            
            {cancelError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
                <p className="font-medium mb-1">Error:</p>
                {cancelError}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} className="border-gray-300">
            Close
          </AlertDialogCancel>
          
          <Button 
            onClick={onConfirm}
            className={`${isCanceled ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium flex items-center gap-2`}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {isCanceled ? (
                  <>Go to Stripe Portal <RefreshCw className="h-4 w-4" /></>
                ) : (
                  <>Go to Stripe Portal <ExternalLink className="h-4 w-4" /></>
                )}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelSubscriptionDialog;
