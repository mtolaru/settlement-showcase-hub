
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import SubscriptionStatus from './SubscriptionStatus';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { settlementService } from '@/services/settlementService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface SubscriptionSectionProps {
  subscription: any | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const SubscriptionSection = ({ subscription, isLoading, onRefresh }: SubscriptionSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const upgradeSubscription = () => {
    navigate('/pricing');
  };
  
  const openCancelDialog = () => {
    setConfirmDialogOpen(true);
  };

  const cancelSubscription = async () => {
    if (!subscription || !subscription.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No active subscription found to cancel."
      });
      return;
    }

    setIsCancelling(true);
    try {
      await settlementService.cancelSubscription(subscription.id);
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been successfully cancelled."
      });
      onRefresh();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel subscription. Please try again."
      });
    } finally {
      setIsCancelling(false);
      setConfirmDialogOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Subscription</h2>
        
        {subscription?.is_active ? (
          <Button 
            variant="outline" 
            onClick={openCancelDialog}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Subscription"
            )}
          </Button>
        ) : (
          <Button onClick={upgradeSubscription}>
            Upgrade
          </Button>
        )}
      </div>

      <SubscriptionStatus subscription={subscription} isLoading={isLoading} />

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? Your premium settlements will be hidden until you resubscribe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep My Subscription</AlertDialogCancel>
            <AlertDialogAction onClick={cancelSubscription} className="bg-red-600 hover:bg-red-700">
              Yes, Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubscriptionSection;
