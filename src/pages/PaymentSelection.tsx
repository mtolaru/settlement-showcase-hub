
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const PaymentSelection = () => {
  const features = [
    "Multiple settlement showcases",
    "Continuous visibility",
    "Priority support",
    "Social sharing tools",
    "Rank number one in your specialty",
    "Show up above large firms",
    "Turn settlements into powerful marketing",
    "Be featured alongside top firms",
    "Dominate your city settlement visibility"
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-12">
        <div className="container">
          <Link to="/submit">
            <Button variant="ghost" className="text-white mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Submission
            </Button>
          </Link>
          <h1 className="text-4xl font-bold font-display mb-4">Professional Plan</h1>
          <p className="text-primary-200 max-w-2xl">
            Maximize your visibility and turn your settlements into powerful marketing assets.
          </p>
        </div>
      </div>

      {/* Plan Details */}
      <div className="container py-12">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6 border-2 border-primary-500"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">Professional Plan</h3>
              <div className="text-3xl font-bold text-primary-900">
                $199
                <span className="text-base font-normal text-neutral-600">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {features.map((feature) => (
                <li key={feature} className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-primary-500 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link to="/checkout">
              <Button className="w-full bg-primary-500 hover:bg-primary-600">
                Select Plan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What's included in the Professional Plan?</h3>
              <p className="text-neutral-600">
                Our Professional Plan includes everything you need to maximize your visibility and turn your settlements into powerful marketing assets. You'll get multiple settlement showcases, priority support, and tools to dominate your local market.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-neutral-600">
                Yes, you can cancel your subscription at any time. Your benefits will continue until the end of your current billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSelection;
