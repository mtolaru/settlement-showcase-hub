import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Pricing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const isSubmissionFlow = location.pathname === '/submit';

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

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      // If user is not logged in, direct them to the submit flow
      navigate('/submit');
      return;
    }
    
    // If user is logged in, take them to their account page
    navigate('/manage');
  };

  // Determine button text based on authentication status
  const getButtonText = () => {
    if (isLoading) {
      return "Processing...";
    }
    
    if (isAuthenticated) {
      return "View My Account";
    }
    
    return "Submit Your Settlement";
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-primary-900 text-white py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold font-display mb-6">Maximize Your Visibility</h1>
            <p className="text-primary-200 text-lg">
              Turn your settlements into your most powerful marketing asset and dominate your market.
            </p>
          </div>
        </div>
      </div>

      <div className="container py-16">
        <div className="max-w-lg mx-auto -mt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-8 border-2 border-primary-500"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Professional Plan</h3>
              <div className="text-4xl font-bold text-primary-900">
                $199
                <span className="text-base font-normal text-neutral-600">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center text-neutral-600">
                  <Check className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full bg-primary-500 hover:bg-primary-600"
              disabled={isLoading}
              onClick={handleSubscribe}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {getButtonText()} <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </div>

        <div className="max-w-3xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Professional Plan?
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-3">
                Maximize Your Market Presence
              </h3>
              <p className="text-neutral-600">
                Stand out in your specialty area and ensure your success stories are seen by potential clients. Our platform helps you rise above the competition and establish your firm as a leader in your field.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">
                Turn Settlements into Marketing Power
              </h3>
              <p className="text-neutral-600">
                Every settlement is an opportunity to showcase your expertise. Our platform helps you transform your victories into compelling marketing assets that attract new clients.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">
                Dominate Local Search Results
              </h3>
              <p className="text-neutral-600">
                Take control of your local market presence. Our platform ensures your settlements are prominently displayed to potential clients in your area, helping you build a stronger local presence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
