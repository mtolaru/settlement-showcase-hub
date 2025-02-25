
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ArrowRight } from "lucide-react";

interface PaymentFormProps {
  onSubmit: (result: any) => void;
  formData: any;
}

export const PaymentForm = ({ onSubmit, formData }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handlePaymentSubmit = async () => {
    if (!stripe || !elements) {
      return;
    }

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 9900, // $99 in cents
          settlementData: formData
        }),
      });

      const { clientSecret } = await response.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            email: formData.attorneyEmail,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      onSubmit(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
      <div className="p-4 border rounded-md">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4'
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <div className="text-sm text-neutral-600">
        You will be charged $99 for submitting this settlement.
      </div>
      <Button
        type="button"
        onClick={handlePaymentSubmit}
        disabled={!stripe}
        className="bg-primary-500 hover:bg-primary-600 w-full"
      >
        Submit and Pay <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};
