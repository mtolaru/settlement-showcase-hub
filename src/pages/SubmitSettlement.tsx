
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const SubmitSettlement = () => {
  const [step, setStep] = useState(1);

  const settlementTypes = [
    "Car Accident",
    "Medical Malpractice",
    "Slip & Fall",
    "Workplace Injury",
    "Product Liability",
    "Other",
  ];

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
                  <input
                    type="text"
                    className="form-input"
                    placeholder="$1,000,000"
                  />
                </div>
                <div>
                  <label className="form-label">Case Type</label>
                  <select className="form-input">
                    <option value="">Select Case Type</option>
                    {settlementTypes.map((type) => (
                      <option key={type} value={type.toLowerCase()}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Settlement Date</label>
                  <input type="date" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Case Description</label>
                  <textarea
                    className="form-input min-h-[120px]"
                    placeholder="Provide a brief description of the case..."
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="form-label">Attorney Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="form-label">Law Firm</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Smith & Associates"
                  />
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Los Angeles, CA"
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="john@smithlaw.com"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">Review Your Submission</h3>
                <div className="space-y-4 text-sm">
                  <div className="p-4 bg-neutral-50 rounded-md">
                    <p className="text-neutral-500 mb-1">Settlement Amount</p>
                    <p className="font-medium">$1,000,000</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-md">
                    <p className="text-neutral-500 mb-1">Case Type</p>
                    <p className="font-medium">Car Accident</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-md">
                    <p className="text-neutral-500 mb-1">Attorney Information</p>
                    <p className="font-medium">John Smith</p>
                    <p className="text-neutral-600">Smith & Associates</p>
                    <p className="text-neutral-600">Los Angeles, CA</p>
                  </div>
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
                  <Link to="/payment-plans">
                    <Button className="bg-primary-500 hover:bg-primary-600">
                      Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
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
