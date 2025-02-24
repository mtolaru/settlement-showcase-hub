import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Trophy, ArrowRight } from "lucide-react";

const SettlementDetail = () => {
  const { id } = useParams();

  // Sample data - would come from API in production
  const settlement = {
    id: 1,
    amount: 2500000,
    type: "Car Accident",
    firm: "Smith & Associates",
    attorney: "John Smith",
    location: "Los Angeles, CA",
    date: "March 2024",
    description: "Successful resolution of a complex automotive accident case resulting in severe injuries to our client. Settlement achieved through strategic negotiation and comprehensive evidence presentation.",
    details: {
      caseLength: "14 months",
      jurisdiction: "Los Angeles County Superior Court",
      insuranceCarrier: "Major National Insurance Co.",
      injuries: "Multiple fractures, traumatic brain injury",
    },
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-12">
        <div className="container">
          <Link to="/settlements">
            <Button variant="ghost" className="text-white mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
            </Button>
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold font-display mb-2">
                ${(settlement.amount / 1000000).toFixed(1)}M Settlement
              </h1>
              <p className="text-primary-200">{settlement.type}</p>
            </div>
            <Button variant="outline" className="text-white border-white hover:bg-white/10">
              <Share2 className="mr-2 h-4 w-4" /> Share Settlement
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-bold mb-4">Case Overview</h2>
              <p className="text-neutral-600">{settlement.description}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-bold mb-4">Case Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(settlement.details).map(([key, value]) => (
                  <div key={key} className="p-4 bg-neutral-50 rounded-md">
                    <p className="text-sm text-neutral-500 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="font-medium text-neutral-900">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-bold mb-4">Attorney Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-500">Attorney</p>
                  <p className="font-medium">{settlement.attorney}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Firm</p>
                  <p className="font-medium">{settlement.firm}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Location</p>
                  <p className="font-medium">{settlement.location}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-primary-50 rounded-lg shadow-md p-6"
            >
              <div className="flex items-center gap-3 text-primary-900 mb-4">
                <Trophy className="h-5 w-5" />
                <h2 className="text-lg font-bold">Submit Your Settlement</h2>
              </div>
              <p className="text-neutral-600 mb-4">
                Join the leading attorneys showcasing their success stories.
              </p>
              <Link to="/submit">
                <Button className="w-full bg-primary-500 hover:bg-primary-600">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementDetail;
