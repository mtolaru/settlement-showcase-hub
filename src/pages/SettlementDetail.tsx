
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Trophy, ArrowRight } from "lucide-react";

const SettlementDetail = () => {
  const { id } = useParams();

  // Sample data - would come from API in production
  const settlements = {
    1: {
      id: 1,
      amount: 2500000,
      type: "Motor Vehicle Accidents",
      firm: "Smith & Associates",
      attorney: "Sarah Johnson",
      location: "Los Angeles, CA",
      date: "March 2024",
      description: "Successful resolution of a complex motor vehicle accident case resulting in severe injuries to our client. Settlement achieved through strategic negotiation and comprehensive evidence presentation.",
      details: {
        caseLength: "14 months",
        jurisdiction: "Los Angeles County Superior Court",
        insuranceCarrier: "Major National Insurance Co.",
        injuries: "Multiple fractures, traumatic brain injury",
      },
    },
    2: {
      id: 2,
      amount: 3100000,
      type: "Medical Malpractice",
      firm: "Johnson Legal Group",
      attorney: "Michael Chen",
      location: "Los Angeles, CA",
      date: "March 2024",
      description: "Resolution of a complex medical malpractice case involving surgical complications. Settlement achieved through expert testimony and detailed documentation of care standards violations.",
      details: {
        caseLength: "24 months",
        jurisdiction: "San Francisco Superior Court",
        insuranceCarrier: "Healthcare Insurance Provider",
        injuries: "Permanent disability, ongoing care required",
      },
    },
    3: {
      id: 3,
      amount: 1800000,
      type: "Premises Liability",
      firm: "Pacific Law Partners",
      attorney: "David Martinez",
      location: "Los Angeles, CA",
      date: "March 2024",
      description: "Successfully settled premises liability case involving hazardous conditions at a commercial property. Case resolved through mediation and comprehensive documentation of safety violations.",
      details: {
        caseLength: "10 months",
        jurisdiction: "Los Angeles County Superior Court",
        insuranceCarrier: "Commercial Property Insurance Co.",
        injuries: "Spinal injury, chronic pain",
      },
    },
    4: {
      id: 4,
      amount: 4200000,
      type: "Product Liability",
      firm: "West Coast Legal",
      attorney: "Emily Rodriguez",
      location: "Los Angeles, CA",
      date: "March 2024",
      description: "Major product liability settlement involving defective consumer products. Case resolved through extensive expert testimony and product testing evidence.",
      details: {
        caseLength: "18 months",
        jurisdiction: "California State Court",
        insuranceCarrier: "Manufacturing Insurance Group",
        injuries: "Severe burns, permanent scarring",
      },
    }
  };

  const settlement = settlements[Number(id)];

  if (!settlement) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Settlement Not Found</h1>
          <Link to="/settlements">
            <Button variant="default">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
