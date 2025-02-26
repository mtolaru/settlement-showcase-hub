
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PaymentTest = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutSession = async () => {
    setIsLoading(true);
    try {
      const temporaryId = crypto.randomUUID();
      
      // Create a test price ID in Stripe first
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          // We'll need to replace this with your actual price ID from Stripe
          priceId: 'price_REPLACE_WITH_YOUR_ACTUAL_PRICE_ID',
          userId: temporaryId,
          returnUrl: `${window.location.origin}/confirmation?temporaryId=${temporaryId}`,
        },
      });

      console.log('Checkout response:', response); // Add debug logging

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { url } = response.data;
      if (!url) {
        throw new Error('No checkout URL received');
      }

      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate checkout. Please try again.",
      });
    } finally {
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
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTest;
