
import { format } from "date-fns";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  payment_id?: string | null;
  temporary_id?: string | null;
}

interface SubscriptionStatusProps {
  subscription: Subscription | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

const SubscriptionStatus = ({ subscription, isLoading, onRefresh }: SubscriptionStatusProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [unsubscribeDialogOpen, setUnsubscribeDialogOpen] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading subscription details...</span>
      </div>
    );
  }

  const handleManualSync = () => {
    if (onRefresh) {
      toast({
        title: "Syncing subscription status",
        description: "Checking for recent subscription changes...",
      });
      onRefresh();
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscription?.id) return;
    
    setIsUnsubscribing(true);
    try {
      // Call Stripe to cancel subscription
      const response = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId: subscription.id
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Update local state and close dialog
      setUnsubscribeDialogOpen(false);
      
      // Refresh subscription status
      if (onRefresh) {
        onRefresh();
      }
      
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled. You'll have access until the end of your current billing period.",
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
      });
    } finally {
      setIsUnsubscribing(false);
    }
  };

  if (!subscription?.is_active) {
    return (
      <div className="space-y-4">
        <p className="text-neutral-600">
          You currently don't have an active subscription. Subscribe to unlock unlimited settlement submissions and more features.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => navigate('/pricing')}>
            Subscribe Now
          </Button>
          <Button 
            variant="outline" 
            onClick={handleManualSync}
          >
            Sync Subscription Status
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
        <div className="rounded-full bg-primary-100 p-3">
          <CreditCard className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-primary-900">Active Subscription</h3>
          <p className="text-primary-700 mt-1">
            Your subscription is active {subscription.ends_at ? `until ${formatDate(subscription.ends_at)}` : '(ongoing)'}
          </p>
          <ul className="mt-4 space-y-2 text-primary-700">
            <li className="flex items-center gap-2">
              ✓ Unlimited settlement submissions
            </li>
            <li className="flex items-center gap-2">
              ✓ Access to detailed analytics
            </li>
            <li className="flex items-center gap-2">
              ✓ Priority support
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="font-medium mb-2">Subscription Details</h4>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-neutral-600">Started on</dt>
            <dd className="font-medium">{formatDate(subscription.starts_at)}</dd>
          </div>
          {subscription.ends_at && (
            <div>
              <dt className="text-neutral-600">Expires on</dt>
              <dd className="font-medium">{formatDate(subscription.ends_at)}</dd>
            </div>
          )}
          {subscription.payment_id && (
            <div>
              <dt className="text-neutral-600">Payment ID</dt>
              <dd className="font-medium">{subscription.payment_id}</dd>
            </div>
          )}
        </dl>
        
        <div className="mt-6">
          <Button 
            variant="outline"
            onClick={() => setUnsubscribeDialogOpen(true)}
            className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50"
          >
            Cancel Subscription
          </Button>
        </div>
      </div>

      <Dialog open={unsubscribeDialogOpen} onOpenChange={setUnsubscribeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll still have access to all features until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnsubscribeDialogOpen(false)} disabled={isUnsubscribing}>
              Keep Subscription
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleUnsubscribe}
              disabled={isUnsubscribing}
            >
              {isUnsubscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionStatus;
