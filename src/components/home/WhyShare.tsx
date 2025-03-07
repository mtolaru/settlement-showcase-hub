
import { Award, Shield, Sparkles, Briefcase, Share2, LineChart } from "lucide-react";
import { motion } from "framer-motion";

const WhyShare = () => {
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

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Share Your Settlements?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-primary-50 p-6 rounded-lg shadow-md flex flex-col items-center text-center"
              >
                {feature.icon}
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-neutral-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyShare;
