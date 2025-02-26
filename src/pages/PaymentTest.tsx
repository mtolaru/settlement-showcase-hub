
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PaymentTest = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const createCheckoutSession = async () => {
    setIsLoading(true);
    try {
      const temporaryId = crypto.randomUUID();
      
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          temporaryId,
          returnUrl: `${window.location.origin}/confirmation?temporaryId=${temporaryId}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { url } = response.data;
      if (url) {
        console.log('Checkout URL received:', url);
        setCheckoutUrl(url);
        window.location.replace(url);
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate checkout. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container py-12">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Test Stripe Payment</h3>
              <div className="bg-primary-50 border border-primary-100 p-6 rounded-lg">
                <h4 className="font-medium text-primary-900 mb-2">Professional Plan Subscription</h4>
                <p className="text-sm text-primary-700 mb-4">
                  Subscribe to our Professional Plan for $199/month to submit and showcase your settlements.
                </p>
                {checkoutUrl ? (
                  <div className="space-y-3">
                    <p className="text-sm text-amber-600">
                      If the checkout page doesn't load automatically, please click below:
                    </p>
                    <Button 
                      onClick={() => window.open(checkoutUrl, '_blank')}
                      className="w-full bg-primary-500 hover:bg-primary-600"
                    >
                      Open Checkout
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={createCheckoutSession}
                    disabled={isLoading}
                    className="w-full bg-primary-500 hover:bg-primary-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Test Subscribe Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTest;
