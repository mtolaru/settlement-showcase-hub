
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Trophy, Users, Search, Filter, Share2 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50 to-white z-0" />
        <div className="container relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight font-display text-primary-900"
          >
            Turn Your Settlements Into Your
            <br />
            <span className="text-primary-500">Most Powerful Marketing Asset</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-neutral-600 text-lg md:text-xl mb-8 max-w-2xl mx-auto"
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
            <Button size="lg" className="bg-primary-500 hover:bg-primary-600">
              Submit Your Settlement <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary-500 text-primary-500 hover:bg-primary-50">
              View Settlements
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Featured Settlements Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold font-display text-primary-900">Featured Settlements</h2>
            <div className="flex gap-4">
              <Button variant="outline" size="sm" className="text-neutral-700">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="text-neutral-700">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="settlement-card"
              >
                <div className="settlement-card-header">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-3xl font-bold text-primary-500">$2.5M</span>
                      <p className="text-sm text-neutral-600">Car Accident</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-primary-500">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="settlement-card-body">
                  <p className="font-medium text-neutral-900">Smith & Associates</p>
                  <p className="text-sm text-neutral-600">Los Angeles, CA</p>
                  <p className="text-sm text-neutral-600">Settlement Date: March 2024</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" className="border-primary-500 text-primary-500 hover:bg-primary-50">
              View All Settlements
            </Button>
          </div>
        </div>
      </section>

      {/* Why SettlementWins Section */}
      <section className="py-24 bg-neutral-50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display text-primary-900">Why SettlementWins?</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
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
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <feature.icon className="h-12 w-12 text-primary-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2 font-display text-primary-900">{feature.title}</h3>
                <p className="text-neutral-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg

-primary-50">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display text-primary-900">
              Ready to Showcase Your Settlements?
            </h2>
            <p className="text-neutral-600 mb-8">
              Join the leading attorneys who are already leveraging their settlement wins
              to attract high-value cases.
            </p>
            <Button size="lg" className="bg-primary-500 hover:bg-primary-600">
              Get Started Today <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
