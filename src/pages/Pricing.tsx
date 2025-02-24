
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
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
      <div className="bg-primary-900 text-white py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold font-display mb-6">Simple, Transparent Pricing</h1>
            <p className="text-primary-200 text-lg">
              Choose the plan that best fits your needs. All plans include access to our
              core features.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto -mt-32">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-lg p-8 relative ${
                plan.popular ? "border-2 border-primary-500" : ""
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
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-primary-900">
                  ${plan.price}
                  <span className="text-base font-normal text-neutral-600">
                    /{plan.period}
                  </span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-neutral-600">
                    <Check className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/submit">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary-500 hover:bg-primary-600"
                      : "bg-white border-2 border-primary-500 text-primary-500 hover:bg-primary-50"
                  }`}
                >
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-3">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-neutral-600">
                Yes, you can change your plan at any time. When upgrading, you'll have
                immediate access to the new features. When downgrading, you'll maintain
                access to your current features until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">
                What payment methods do you accept?
              </h3>
              <p className="text-neutral-600">
                We accept all major credit cards, including Visa, Mastercard, and American
                Express. All payments are processed securely through Stripe.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">
                Is there a contract or commitment?
              </h3>
              <p className="text-neutral-600">
                No long-term contracts required. You can cancel your subscription at any
                time, and you won't be charged for the next period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
