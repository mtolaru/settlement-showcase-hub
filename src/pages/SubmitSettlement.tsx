import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CardElement } from "@stripe/react-stripe-js";

const SubmitSettlement = () => {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    amount: "",
    caseType: "",
    caseDetails: {
      carAccident: {
        vehicleType: "",
        injuryType: "",
        atFault: ""
      },
      workplaceInjury: {
        injuryType: "",
        workSector: "",
        employerSize: ""
      },
      medicalMalpractice: {
        procedureType: "",
        facilityType: "",
        injuryType: ""
      },
      slipAndFall: {
        locationType: "",
        injuryType: "",
        propertyType: ""
      }
    },
    attorneyName: "",
    attorneyEmail: "",
    firmName: "",
    location: ""
  });

  const settlementTypes = [
    "Car Accident",
    "Medical Malpractice",
    "Slip & Fall",
    "Workplace Injury",
    "Product Liability",
    "Other",
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Create payment intent first
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

      // Handle payment with Stripe
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

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

      // Payment successful, save settlement
      toast({
        title: "Success!",
        description: "Your settlement has been submitted successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
      });
    }
  };

  const renderCaseSpecificFields = () => {
    switch (formData.caseType) {
      case "Car Accident":
        return (
          <div className="space-y-4">
            <div>
              <label className="form-label">Vehicle Type</label>
              <Input
                type="text"
                value={formData.caseDetails.carAccident.vehicleType}
                onChange={(e) => handleInputChange("caseDetails.carAccident.vehicleType", e.target.value)}
                placeholder="e.g., Sedan, SUV, Truck"
              />
            </div>
            <div>
              <label className="form-label">Injury Type</label>
              <Input
                type="text"
                value={formData.caseDetails.carAccident.injuryType}
                onChange={(e) => handleInputChange("caseDetails.carAccident.injuryType", e.target.value)}
                placeholder="e.g., Whiplash, Broken Bones"
              />
            </div>
            <div>
              <label className="form-label">At Fault Party</label>
              <Input
                type="text"
                value={formData.caseDetails.carAccident.atFault}
                onChange={(e) => handleInputChange("caseDetails.carAccident.atFault", e.target.value)}
                placeholder="e.g., Other Driver, Multiple Parties"
              />
            </div>
          </div>
        );
      // ... Add similar case-specific fields for other case types
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-12">
        <div className="container">
          <Link to="/">
            <Button variant="ghost" className="text-white mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold font-display mb-4">Submit Your Settlement</h1>
          <p className="text-primary-200 max-w-2xl">
            Share your success story and join the leading platform for personal injury settlements.
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex items-center ${s < 3 ? "flex-1" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      s <= step ? "bg-primary-500 text-white" : "bg-neutral-200"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-1 mx-4 ${
                        s < step ? "bg-primary-500" : "bg-neutral-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Settlement Details</span>
              <span>Attorney Information</span>
              <span>Review & Submit</span>
            </div>
          </div>

          {/* Form Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="form-label">Settlement Amount</label>
                  <Input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    placeholder="$1,000,000"
                  />
                </div>
                <div>
                  <label className="form-label">Case Type</label>
                  <select 
                    className="form-input"
                    value={formData.caseType}
                    onChange={(e) => handleInputChange("caseType", e.target.value)}
                  >
                    <option value="">Select Case Type</option>
                    {settlementTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                {renderCaseSpecificFields()}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="form-label">Attorney Name</label>
                  <Input
                    type="text"
                    value={formData.attorneyName}
                    onChange={(e) => handleInputChange("attorneyName", e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <Input
                    type="email"
                    value={formData.attorneyEmail}
                    onChange={(e) => handleInputChange("attorneyEmail", e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="form-label">Law Firm</label>
                  <Input
                    type="text"
                    value={formData.firmName}
                    onChange={(e) => handleInputChange("firmName", e.target.value)}
                    placeholder="Smith & Associates"
                  />
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Los Angeles, CA"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                <div className="p-4 border rounded-md">
                  <CardElement options={{
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
                  }}/>
                </div>
                <div className="text-sm text-neutral-600">
                  You will be charged $99 for submitting this settlement.
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-neutral-100">
              {step > 1 && (
                <Button
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}
              <div className="ml-auto">
                {step < 3 ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    className="bg-primary-500 hover:bg-primary-600"
                  >
                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    className="bg-primary-500 hover:bg-primary-600"
                  >
                    Submit and Pay <ArrowRight className="ml-2 h-4 w-4" />
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

export default SubmitSettlement;
