
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Trophy, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-50 to-white z-0" />
        <div className="container relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            Turn Your Settlements Into Your
            <br />
            <span className="text-gold-600">Most Powerful Marketing Asset</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 text-lg md:text-xl mb-8 max-w-2xl mx-auto"
          >
            The first platform dedicated to showcasing and ranking personal injury wins.
            Join the leading attorneys in Los Angeles.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-x-4"
          >
            <Button size="lg" className="bg-gold-500 hover:bg-gold-600">
              Submit Your Settlement <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              View Settlements
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why SettlementWins?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join the premier platform for personal injury attorneys to showcase their success
              and attract more clients.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Trophy,
                title: "Showcase Success",
                description:
                  "Display your settlements prominently and build credibility with potential clients.",
              },
              {
                icon: Users,
                title: "Join Elite Network",
                description:
                  "Connect with leading personal injury attorneys and expand your professional network.",
              },
              {
                icon: DollarSign,
                title: "Attract More Cases",
                description:
                  "Turn your track record into a powerful marketing asset that brings in high-value cases.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass p-6 rounded-lg card-hover"
              >
                <feature.icon className="h-12 w-12 text-gold-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
