
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Initialize Stripe with publishable key
const stripePromise = loadStripe("pk_test_your_publishable_key_here");

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation`,
      },
    });

    if (error) {
      setErrorMessage(error.message ?? "An unexpected error occurred.");
      setIsProcessing(false);
    }
    // Payment confirmation is handled by return_url
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && (
        <div className="text-error text-sm">{errorMessage}</div>
      )}
      <Button 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
};

const PaymentProcessing = () => {
  const options = {
    mode: 'payment' as const,
    amount: 29900, // Amount in cents
    currency: 'usd',
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-12">
        <div className="container">
          <Link to="/payment-plans">
            <Button variant="ghost" className="text-white mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
            </Button>
          </Link>
          <h1 className="text-4xl font-bold font-display mb-4">Secure Checkout</h1>
          <p className="text-primary-200 max-w-2xl">
            Complete your purchase securely with Stripe
          </p>
        </div>
      </div>

      {/* Payment Form */}
      <div className="container py-12">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-neutral-100">
              <div>
                <h2 className="text-xl font-semibold">Basic Plan</h2>
                <p className="text-neutral-600">One-time payment</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">$299</div>
                <p className="text-sm text-neutral-600">USD</p>
              </div>
            </div>

            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm />
            </Elements>

            <div className="mt-6 pt-6 border-t border-neutral-100">
              <div className="flex items-center justify-center text-sm text-neutral-600">
                <Lock className="h-4 w-4 mr-2" />
                Secured by Stripe
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;
