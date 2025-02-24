
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, Filter, Share2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Gallery = () => {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("amount");

  const caseTypes = [
    "All",
    "Car Accident",
    "Medical Malpractice",
    "Slip & Fall",
    "Workplace Injury",
  ];

  // Sample data - would come from API in production
  const settlements = [
    {
      id: 1,
      amount: 2500000,
      type: "Car Accident",
      firm: "Smith & Associates",
      location: "Los Angeles, CA",
      date: "March 2024",
    },
    {
      id: 2,
      amount: 1800000,
      type: "Medical Malpractice",
      firm: "Johnson Legal Group",
      location: "San Francisco, CA",
      date: "February 2024",
    },
    {
      id: 3,
      amount: 950000,
      type: "Slip & Fall",
      firm: "Roberts & Partners",
      location: "San Diego, CA",
      date: "January 2024",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold font-display mb-4">Settlement Gallery</h1>
          <p className="text-primary-200 max-w-2xl">
            Browse through our collection of successful settlements. Filter by case type,
            sort by amount, and find the information you need.
          </p>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="container py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {caseTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type.toLowerCase() ? "default" : "outline"}
                  onClick={() => setSelectedType(type.toLowerCase())}
                  className="whitespace-nowrap"
                >
                  {type}
                </Button>
              ))}
            </div>
            <div className="flex gap-4">
              <select
                className="form-input bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="amount">Sort by Amount</option>
                <option value="date">Sort by Date</option>
                <option value="firm">Sort by Firm</option>
              </select>
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Settlement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settlements.map((settlement, index) => (
            <motion.div
              key={settlement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="settlement-card"
            >
              <div className="settlement-card-header">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-3xl font-bold text-primary-500">
                      ${(settlement.amount / 1000000).toFixed(1)}M
                    </span>
                    <p className="text-sm text-neutral-600">{settlement.type}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="settlement-card-body">
                <p className="font-medium text-neutral-900">{settlement.firm}</p>
                <p className="text-sm text-neutral-600">{settlement.location}</p>
                <p className="text-sm text-neutral-600">Settlement Date: {settlement.date}</p>
              </div>
              <div className="settlement-card-footer">
                <Link to={`/settlements/${settlement.id}`}>
                  <Button variant="outline" className="w-full">
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Submit CTA */}
        <div className="mt-12 text-center">
          <div className="bg-primary-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold font-display text-primary-900 mb-4">
              Ready to Showcase Your Settlement?
            </h2>
            <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
              Join the leading attorneys who are already leveraging their settlement wins
              to attract high-value cases.
            </p>
            <Link to="/submit">
              <Button size="lg" className="bg-primary-500 hover:bg-primary-600">
                Submit Your Settlement <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
