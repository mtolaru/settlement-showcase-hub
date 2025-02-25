
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import ImageUpload from "@/components/ImageUpload";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface FormData {
  amount: string;
  initialOffer: string;
  policyLimit: string;
  medicalExpenses: string;
  settlementPhase: string;
  caseType: string;
  otherCaseType: string;
  caseDescription: string;
  caseDetails: {
    carAccident: {
      vehicleType: string;
      injuryType: string;
      atFault: string;
    };
    workplaceInjury: {
      injuryType: string;
      workSector: string;
      employerSize: string;
    };
    medicalMalpractice: {
      procedureType: string;
      facilityType: string;
      injuryType: string;
    };
    slipAndFall: {
      locationType: string;
      injuryType: string;
      propertyType: string;
    };
  };
  attorneyName: string;
  attorneyEmail: string;
  firmName: string;
  firmWebsite: string;
  location: string;
  photoUrl: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

interface PaymentFormProps {
  onSubmit: (result: any) => void;
  formData: FormData;
}

const formatNumber = (value: string): string => {
  const number = value.replace(/\D/g, '');
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const unformatNumber = (value: string): string => {
  return value.replace(/,/g, '');
};

const PaymentForm = ({ onSubmit, formData }: PaymentFormProps) => {
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

const SubmitSettlement = () => {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    amount: "",
    initialOffer: "",
    policyLimit: "",
    medicalExpenses: "",
    settlementPhase: "",
    caseType: "",
    otherCaseType: "",
    caseDescription: "",
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
    firmWebsite: "",
    location: "",
    photoUrl: ""
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateNumber = (value: string) => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  };

  const handleInputChange = (field: string, value: string) => {
    const numericFields = ['amount', 'initialOffer', 'policyLimit', 'medicalExpenses'];
    if (numericFields.includes(field)) {
      const unformattedValue = unformatNumber(value);
      const formattedValue = formatNumber(unformattedValue);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  const handleImageUpload = (url: string) => {
    handleInputChange("photoUrl", url);
  };

  const handlePaymentSuccess = async (result: any) => {
    toast({
      title: "Success",
      description: "Your settlement has been submitted successfully.",
    });
  };

  const settlementTypes = [
    "Motor Vehicle Accidents",
    "Medical Malpractice",
    "Product Liability",
    "Premises Liability",
    "Wrongful Death",
    "Animal Attack",
    "Assault and Abuse",
    "Boating Accidents",
    "Slip & Fall",
    "Workplace Injury",
    "Other"
  ];

  const validateStep1 = () => {
    const newErrors: FormErrors = {};

    const validateMoneyField = (field: string, label: string) => {
      const value = unformatNumber(formData[field]);
      if (!value || !validateNumber(value)) {
        newErrors[field] = `Please enter a valid ${label} greater than 0`;
      }
    };

    validateMoneyField('amount', 'settlement amount');
    validateMoneyField('initialOffer', 'amount');
    validateMoneyField('policyLimit', 'amount');
    validateMoneyField('medicalExpenses', 'amount');

    if (!formData.settlementPhase) {
      newErrors.settlementPhase = "Please select when the settlement was made";
    }

    if (!formData.caseType) {
      newErrors.caseType = "Please select a case type";
    }

    if (formData.caseType === "Other" && !formData.otherCaseType) {
      newErrors.otherCaseType = "Please describe what 'Other' means";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: FormErrors = {};

    if (!formData.attorneyName?.trim()) {
      newErrors.attorneyName = "Attorney name is required";
    }

    if (!formData.attorneyEmail?.trim()) {
      newErrors.attorneyEmail = "Attorney email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.attorneyEmail)) {
      newErrors.attorneyEmail = "Please enter a valid email address";
    }

    if (!formData.firmName?.trim()) {
      newErrors.firmName = "Law firm name is required";
    }

    if (!formData.firmWebsite?.trim()) {
      newErrors.firmWebsite = "Law firm website is required";
    } else if (!/^https?:\/\/.+/.test(formData.firmWebsite)) {
      newErrors.firmWebsite = "Please enter a valid website URL (starting with http:// or https://)";
    }

    if (!formData.location?.trim()) {
      newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields correctly.",
      });
      return;
    }

    if (step === 2 && !validateStep2()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields correctly.",
      });
      return;
    }

    setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
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

      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="form-label">Settlement Amount*</label>
                  <Input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    placeholder="1,000,000"
                    className="no-spinner"
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Initial Settlement Offer*</label>
                  <Input
                    type="text"
                    value={formData.initialOffer}
                    onChange={(e) => handleInputChange("initialOffer", e.target.value)}
                    placeholder="Enter 0 if no initial offer was made"
                    className="no-spinner"
                  />
                  <p className="text-sm text-neutral-500 mt-1">Enter the initial offer received, if any. Enter 0 if none.</p>
                  {errors.initialOffer && (
                    <p className="text-red-500 text-sm mt-1">{errors.initialOffer}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Insurance Policy Limit*</label>
                  <Input
                    type="text"
                    value={formData.policyLimit}
                    onChange={(e) => handleInputChange("policyLimit", e.target.value)}
                    placeholder="Enter 0 if not applicable"
                    className="no-spinner"
                  />
                  {errors.policyLimit && (
                    <p className="text-red-500 text-sm mt-1">{errors.policyLimit}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Medical Expenses*</label>
                  <Input
                    type="text"
                    value={formData.medicalExpenses}
                    onChange={(e) => handleInputChange("medicalExpenses", e.target.value)}
                    placeholder="Enter 0 if not applicable"
                    className="no-spinner"
                  />
                  {errors.medicalExpenses && (
                    <p className="text-red-500 text-sm mt-1">{errors.medicalExpenses}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Settlement Made*</label>
                  <select 
                    className="form-input w-full rounded-md border border-neutral-200 p-2"
                    value={formData.settlementPhase}
                    onChange={(e) => handleInputChange("settlementPhase", e.target.value)}
                  >
                    <option value="">Select when settlement was made</option>
                    <option value="pre-litigation">Pre-litigation</option>
                    <option value="during-litigation">During litigation</option>
                  </select>
                  {errors.settlementPhase && (
                    <p className="text-red-500 text-sm mt-1">{errors.settlementPhase}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Case Type*</label>
                  <select 
                    className="form-input w-full rounded-md border border-neutral-200 p-2"
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
                  {errors.caseType && (
                    <p className="text-red-500 text-sm mt-1">{errors.caseType}</p>
                  )}
                </div>

                {formData.caseType === "Other" && (
                  <div>
                    <label className="form-label">Please describe what 'Other' means*</label>
                    <Textarea
                      value={formData.otherCaseType}
                      onChange={(e) => handleInputChange("otherCaseType", e.target.value)}
                      placeholder="Please describe the type of case"
                    />
                    {errors.otherCaseType && (
                      <p className="text-red-500 text-sm mt-1">{errors.otherCaseType}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="form-label">Description of Case</label>
                  <Textarea
                    value={formData.caseDescription}
                    onChange={(e) => handleInputChange("caseDescription", e.target.value)}
                    placeholder="Please provide additional details about the case"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="form-label">Attorney Name*</label>
                  <Input
                    type="text"
                    value={formData.attorneyName}
                    onChange={(e) => handleInputChange("attorneyName", e.target.value)}
                    placeholder="John Smith"
                  />
                  {errors.attorneyName && (
                    <p className="text-red-500 text-sm mt-1">{errors.attorneyName}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Professional Photo</label>
                  <p className="text-sm text-neutral-600 mb-2">
                    Upload a professional headshot to be displayed with your settlement
                  </p>
                  <ImageUpload onImageUpload={handleImageUpload} />
                </div>

                <div>
                  <label className="form-label">Email*</label>
                  <Input
                    type="email"
                    value={formData.attorneyEmail}
                    onChange={(e) => handleInputChange("attorneyEmail", e.target.value)}
                    placeholder="john@example.com"
                  />
                  {errors.attorneyEmail && (
                    <p className="text-red-500 text-sm mt-1">{errors.attorneyEmail}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Law Firm*</label>
                  <Input
                    type="text"
                    value={formData.firmName}
                    onChange={(e) => handleInputChange("firmName", e.target.value)}
                    placeholder="Smith & Associates"
                  />
                  {errors.firmName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firmName}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Law Firm Website*</label>
                  <Input
                    type="url"
                    value={formData.firmWebsite}
                    onChange={(e) => handleInputChange("firmWebsite", e.target.value)}
                    placeholder="https://www.example.com"
                  />
                  {errors.firmWebsite && (
                    <p className="text-red-500 text-sm mt-1">{errors.firmWebsite}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Location*</label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Los Angeles, CA"
                  />
                  {errors.location && (
                    <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <Elements stripe={stripePromise}>
                <PaymentForm onSubmit={handlePaymentSuccess} formData={formData} />
              </Elements>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-neutral-100">
              {step > 1 && (
                <Button
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}
              {step < 3 && (
                <div className="ml-auto">
                  <Button
                    onClick={handleNextStep}
                    className="bg-primary-500 hover:bg-primary-600"
                  >
                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SubmitSettlement;
