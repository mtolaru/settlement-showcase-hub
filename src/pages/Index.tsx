
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, Filter, Share2, ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";

const Index = () => {
  const cities = [
    { name: "Los Angeles", active: true },
    { name: "New York", active: false },
    { name: "Miami", active: false },
    { name: "Boston", active: false },
    { name: "Chicago", active: false },
  ];

  const settlements = [
    {
      id: 1,
      image: "/placeholder.svg",
      type: "Car Accident",
      amount: "$2.5M",
      firm: "Smith & Associates",
      location: "Los Angeles, CA",
      date: "March 2024",
    },
    {
      id: 2,
      image: "/placeholder.svg",
      type: "Medical Malpractice",
      amount: "$3.1M",
      firm: "Johnson Legal Group",
      location: "Los Angeles, CA",
      date: "March 2024",
    },
    {
      id: 3,
      image: "/placeholder.svg",
      type: "Workplace Injury",
      amount: "$1.8M",
      firm: "Pacific Law Partners",
      location: "Los Angeles, CA",
      date: "March 2024",
    },
  ];

  return (
    <div className="min-h-screen w-full">
      {/* Header Section */}
      <section className="bg-white border-b border-neutral-200">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-neutral-500" />
              <span className="text-neutral-500">Filters</span>
            </div>
            <h1 className="text-3xl font-bold font-display text-primary-900">
              SettlementWins
            </h1>
            <Link to="/submit">
              <Button>
                Submit a Deal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Input
              type="text"
              placeholder="Search settlements, firms, or case types..."
              className="w-full pl-10 pr-4 py-3 text-lg"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
          </div>
        </div>
      </section>

      {/* City Navigation */}
      <section className="bg-neutral-50 border-b border-neutral-200">
        <div className="container py-4">
          <div className="flex justify-center gap-8">
            {cities.map((city) => (
              <button
                key={city.name}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  city.active
                    ? "bg-primary-500 text-white"
                    : "text-neutral-400 hover:text-neutral-500"
                }`}
                disabled={!city.active}
              >
                {city.name}
                {!city.active && <span className="ml-2">(Coming Soon)</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Settlements Grid */}
      <section className="py-12 bg-neutral-50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settlements.map((settlement) => (
              <motion.div
                key={settlement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 bg-neutral-100">
                  <img
                    src={settlement.image}
                    alt={settlement.type}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-neutral-900">
                      {settlement.type}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-3xl font-bold text-primary-500">
                        {settlement.amount}
                      </span>
                      <p className="text-sm text-neutral-600 mt-1">
                        {settlement.type}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-primary-500">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-neutral-900">{settlement.firm}</p>
                    <div className="flex items-center text-sm text-neutral-600">
                      <Building2 className="h-4 w-4 mr-1" />
                      {settlement.location}
                    </div>
                    <p className="text-sm text-neutral-600">
                      Settlement Date: {settlement.date}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
