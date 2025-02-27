
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Shield, DollarSign, Users, Clock, Sparkles, Briefcase, LineChart, Share2, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const features = [
    {
      title: "Showcase Your Success",
      description: "Display your significant settlements to potential clients and peers in the legal community with prominently featured case details and amounts.",
      icon: <Award className="h-8 w-8 text-primary-500 mb-3" />
    },
    {
      title: "Build Credibility",
      description: "Demonstrate your track record of success with verified settlement information, creating powerful third-party validation for potential clients.",
      icon: <Shield className="h-8 w-8 text-primary-500 mb-3" />
    },
    {
      title: "Create Visibility",
      description: "Gain recognition among peers in your practice area and help potential clients understand the value you bring to their cases.",
      icon: <Sparkles className="h-8 w-8 text-primary-500 mb-3" />
    },
    {
      title: "Differentiate Your Practice",
      description: "Stand out by highlighting your specific case experience and results in ways traditional marketing cannot achieve.",
      icon: <Briefcase className="h-8 w-8 text-primary-500 mb-3" />
    },
    {
      title: "Transform Settlements Into Content",
      description: "Turn your victories into shareable marketing content for your website, social media, and client communications.",
      icon: <Share2 className="h-8 w-8 text-primary-500 mb-3" />
    },
    {
      title: "Enhance Marketing ROI",
      description: "Leverage your real-world results to improve the effectiveness of your existing marketing efforts and attract more qualified leads.",
      icon: <LineChart className="h-8 w-8 text-primary-500 mb-3" />
    }
  ];

  const steps = [
    {
      title: "Submit Your Settlement",
      description: "Enter the details of your successful settlement, including amount, case type, and key information.",
    },
    {
      title: "Choose Your Plan",
      description: "Select the visibility package that best suits your needs and goals with no long-term commitments.",
    },
    {
      title: "Get Featured",
      description: "Your settlement will be showcased in our gallery, attracting potential clients and recognition immediately after submission.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-primary-900 text-white py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-5xl font-bold font-display mb-6">
              Transforming Legal Success Stories Into Powerful Marketing Assets
            </h1>
            <p className="text-primary-200 text-lg mb-8">
              SettlementWins was created with a singular vision: to help attorneys showcase their successful settlements and transform their case victories into their most powerful marketing assets.
            </p>
            <Link to="/submit">
              <Button size="lg" className="bg-white text-primary-900 hover:bg-primary-50">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="container py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-6">Our Story</h2>
          <p className="text-neutral-700 text-lg mb-6">
            SettlementWins was founded by a former attorney and venture entrepreneur who recognized a critical gap in legal marketing. Our founder saw that attorneys were spending significant money on marketing without a specialized platform to highlight their most compelling asset – their actual results.
          </p>
          <p className="text-neutral-700 text-lg">
            Drawing from both legal practice experience and entrepreneurial expertise, our founder built SettlementWins as the first dedicated platform where attorneys can showcase, rank, and leverage their settlement wins to attract clients and gain professional recognition.
          </p>
        </div>
      </div>

      {/* What We Do Section */}
      <div className="bg-neutral-50 py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">What We Do For You</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center"
              >
                {feature.icon}
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-neutral-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose SettlementWins Section */}
      <div className="container py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose SettlementWins</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-start">
              <Lightbulb className="h-8 w-8 text-primary-500 mr-4 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-3">First and Only Dedicated Platform</h3>
                <p className="text-neutral-600">
                  SettlementWins is the first and only platform exclusively focused on showcasing attorney settlements.
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-start">
              <Users className="h-8 w-8 text-primary-500 mr-4 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-3">Built for Attorneys, By Legal Experts</h3>
                <p className="text-neutral-600">
                  Our platform was designed with deep understanding of the legal profession and the unique marketing challenges faced by attorneys.
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-start">
              <DollarSign className="h-8 w-8 text-primary-500 mr-4 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-3">Transparent Pricing, Immediate Results</h3>
                <p className="text-neutral-600">
                  With straightforward pricing and instant publishing, your settlements can start working for your marketing immediately after submission.
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-start">
              <Shield className="h-8 w-8 text-primary-500 mr-4 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-3">Privacy By Design</h3>
                <p className="text-neutral-600">
                  We respect client confidentiality, only displaying the information you choose to share.
                </p>
              </div>
            </div>
          </motion.div>
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
          <h2 className="text-3xl font-bold mb-6">Join the Leading Attorneys Already Building Their Brand Through Their Results</h2>
          <p className="text-neutral-600 mb-8">
            Every successful settlement tells a story of your expertise, dedication, and effectiveness as an attorney. 
            Don't let these powerful stories remain hidden in your case files.
          </p>
          <Link to="/submit">
            <Button size="lg">
              Submit Your First Settlement <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
