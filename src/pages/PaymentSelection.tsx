
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const PaymentSelection = () => {
  const plans = [
    {
      name: "Basic",
      price: 299,
      period: "one-time",
      features: [
        "Single settlement showcase",
        "Basic analytics",
        "30-day visibility",
        "Standard support",
      ],
    },
    {
      name: "Professional",
      price: 99,
      period: "monthly",
      popular: true,
      features: [
        "Multiple settlement showcases",
        "Advanced analytics",
        "Continuous visibility",
        "Priority support",
        "Featured placement",
        "Social sharing tools",
      ],
    },
    {
      name: "Enterprise",
      price: 999,
      period: "yearly",
      features: [
        "Unlimited settlement showcases",
        "Premium analytics",
        "Continuous visibility",
        "24/7 priority support",
        "Featured placement",
        "Custom branding",
        "API access",
      ],
    },
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
          <h1 className="text-4xl font-bold font-display mb-4">Select Your Plan</h1>
          <p className="text-primary-200 max-w-2xl">
            Choose the plan that best fits your needs. All plans include our core features.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                plan.popular
                  ? "border-primary-500 relative"
                  : "border-transparent"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-primary-900">
                  ${plan.price}
                  <span className="text-base font-normal text-neutral-600">
                    /{plan.period}
                  </span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-primary-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/checkout">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary-500 hover:bg-primary-600"
                      : "bg-white border-2 border-primary-500 text-primary-500 hover:bg-primary-50"
                  }`}
                >
                  Select Plan <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What's included in each plan?</h3>
              <p className="text-neutral-600">
                All plans include the ability to showcase settlements, basic analytics,
                and access to our platform. Higher tier plans include additional
                features like multiple showcases and premium placement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I upgrade later?</h3>
              <p className="text-neutral-600">
                Yes, you can upgrade your plan at any time. Your new features will
                be available immediately upon upgrade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSelection;
