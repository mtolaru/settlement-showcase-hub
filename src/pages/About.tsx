
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const features = [
    {
      title: "Showcase Your Success",
      description: "Display your significant settlements to potential clients and peers in the legal community.",
    },
    {
      title: "Build Credibility",
      description: "Demonstrate your track record of success with verified settlement information.",
    },
    {
      title: "Attract High-Value Cases",
      description: "Help potential clients understand the value you can bring to their cases.",
    },
  ];

  const steps = [
    {
      title: "Submit Your Settlement",
      description: "Enter the details of your successful settlement, including amount, case type, and key information.",
    },
    {
      title: "Choose Your Plan",
      description: "Select the visibility package that best suits your needs and goals.",
    },
    {
      title: "Get Featured",
      description: "Your settlement will be showcased in our gallery, attracting potential clients and recognition.",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="bg-primary-900 text-white py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-5xl font-bold font-display mb-6">
              Showcase Your Legal Success
            </h1>
            <p className="text-primary-200 text-lg mb-8">
              Join the leading platform for personal injury attorneys to showcase their
              settlements and attract high-value cases.
            </p>
            <Link to="/submit">
              <Button size="lg" className="bg-white text-primary-900 hover:bg-primary-50">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose SettlementWins?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-neutral-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-primary-50 py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-primary-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-neutral-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Showcase Your Success?</h2>
          <p className="text-neutral-600 mb-8">
            Join the leading attorneys who are already leveraging their settlement wins
            to attract high-value cases.
          </p>
          <Link to="/pricing">
            <Button size="lg">
              View Pricing Plans <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
