
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, ArrowRight } from "lucide-react";
import { settlements } from "@/data/settlements";
import { ShareButton } from "@/components/sharing/ShareButton";

const SettlementDetail = () => {
  const { id } = useParams();
  const settlement = settlements.find(s => s.id === Number(id));

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatSettlementPhase = (phase: string | null) => {
    if (!phase) return '';
    
    switch (phase.toLowerCase()) {
      case 'pre-litigation':
        return 'Pre-Litigation';
      case 'during-litigation':
        return 'During Litigation';
      default:
        return phase;
    }
  };

  if (!settlement) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Settlement Not Found</h1>
          <Link to="/settlements">
            <Button variant="default">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leaderboard
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
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leaderboard
            </Button>
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold font-display mb-2">
                {formatAmount(settlement.amount)} Settlement
              </h1>
              <p className="text-primary-200">{settlement.type}</p>
            </div>
            <ShareButton 
              url={`${window.location.origin}/settlements/${id}`}
              title={`${formatAmount(settlement.amount)} Settlement - ${settlement.type}`}
              amount={settlement.amount.toString()}
              caseType={settlement.type}
              variant="button"
              className="outline-on-dark"
            />
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
                {/* Initial Settlement Offer */}
                <div className="p-4 bg-neutral-50 rounded-md">
                  <p className="text-sm text-neutral-500">Initial Settlement Offer</p>
                  <p className="font-medium text-neutral-900">
                    {settlement.initial_offer ? formatAmount(settlement.initial_offer) : 'N/A'}
                  </p>
                </div>

                {/* Insurance Policy Limit */}
                <div className="p-4 bg-neutral-50 rounded-md">
                  <p className="text-sm text-neutral-500">Insurance Policy Limit</p>
                  <p className="font-medium text-neutral-900">
                    {settlement.policy_limit ? formatAmount(settlement.policy_limit) : 'N/A'}
                  </p>
                </div>

                {/* Medical Expenses */}
                <div className="p-4 bg-neutral-50 rounded-md">
                  <p className="text-sm text-neutral-500">Medical Expenses</p>
                  <p className="font-medium text-neutral-900">
                    {settlement.medical_expenses ? formatAmount(settlement.medical_expenses) : 'N/A'}
                  </p>
                </div>

                {/* Settlement Phase */}
                <div className="p-4 bg-neutral-50 rounded-md">
                  <p className="text-sm text-neutral-500">Settlement Phase</p>
                  <p className="font-medium text-neutral-900">
                    {formatSettlementPhase(settlement.settlement_phase)}
                  </p>
                </div>
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
              <div className="flex gap-6">
                {settlement.photo_url && (
                  <img
                    src={settlement.photo_url}
                    alt={settlement.attorney}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-neutral-500">Attorney</p>
                    <p className="font-medium">{settlement.attorney}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Firm</p>
                    <p className="font-medium">
                      {settlement.firmWebsite ? (
                        <a 
                          href={settlement.firmWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {settlement.firm}
                        </a>
                      ) : (
                        settlement.firm
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Location</p>
                    <p className="font-medium">{settlement.location}</p>
                  </div>
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
