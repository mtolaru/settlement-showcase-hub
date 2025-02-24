import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, Filter, Share2, ArrowRight, Building2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

const Index = () => {
  const [filters, setFilters] = useState({
    caseTypes: [],
    minAmount: "",
    maxAmount: "",
    location: "",
    date: ""
  });

  const cities = [
    { name: "Los Angeles", active: true },
    { name: "New York", active: false },
    { name: "Miami", active: false },
  ];

  const settlements = [
    {
      id: 1,
      image: "/placeholder.svg",
      type: "Car Accident",
      amount: "$2.5M",
      lawyer: "Sarah Johnson",
      firm: "Smith & Associates",
      location: "Los Angeles, CA",
      date: "March 2024",
    },
    {
      id: 2,
      image: "/placeholder.svg",
      type: "Medical Malpractice",
      amount: "$3.1M",
      lawyer: "Michael Chen",
      firm: "Johnson Legal Group",
      location: "Los Angeles, CA",
      date: "March 2024",
    },
    {
      id: 3,
      image: "/placeholder.svg",
      type: "Workplace Injury",
      amount: "$1.8M",
      lawyer: "David Martinez",
      firm: "Pacific Law Partners",
      location: "Los Angeles, CA",
      date: "March 2024",
    },
    {
      id: 4,
      image: "/placeholder.svg",
      type: "Product Liability",
      amount: "$4.2M",
      lawyer: "Emily Rodriguez",
      firm: "West Coast Legal",
      location: "Los Angeles, CA",
      date: "March 2024",
    },
    {
      id: 5,
      image: "/placeholder.svg",
      type: "Medical Malpractice",
      amount: "$2.9M",
      lawyer: "James Wilson",
      firm: "Wilson & Partners",
      location: "Los Angeles, CA",
      date: "February 2024",
    },
    {
      id: 6,
      image: "/placeholder.svg",
      type: "Car Accident",
      amount: "$1.5M",
      lawyer: "Lisa Thompson",
      firm: "Thompson Law Group",
      location: "Los Angeles, CA",
      date: "February 2024",
    },
    {
      id: 7,
      image: "/placeholder.svg",
      type: "Workplace Injury",
      amount: "$2.2M",
      lawyer: "Robert Kim",
      firm: "Kim & Associates",
      location: "Los Angeles, CA",
      date: "February 2024",
    },
    {
      id: 8,
      image: "/placeholder.svg",
      type: "Slip and Fall",
      amount: "$1.1M",
      lawyer: "Maria Garcia",
      firm: "Garcia Law Firm",
      location: "Los Angeles, CA",
      date: "February 2024",
    },
  ];

  const filteredSettlements = settlements.filter(settlement => {
    if (filters.caseTypes.length > 0 && !filters.caseTypes.includes(settlement.type)) {
      return false;
    }
    if (filters.minAmount && parseInt(settlement.amount.replace(/\D/g, '')) < parseInt(filters.minAmount)) {
      return false;
    }
    if (filters.maxAmount && parseInt(settlement.amount.replace(/\D/g, '')) > parseInt(filters.maxAmount)) {
      return false;
    }
    if (filters.location && !settlement.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    if (filters.date && settlement.date !== filters.date) {
      return false;
    }
    return true;
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCaseTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      caseTypes: prev.caseTypes.includes(type)
        ? prev.caseTypes.filter(t => t !== type)
        : [...prev.caseTypes, type]
    }));
  };

  const clearFilters = () => {
    setFilters({
      caseTypes: [],
      minAmount: "",
      maxAmount: "",
      location: "",
      date: ""
    });
  };

  return (
    <div className="min-h-screen w-full">
      {/* Header Section */}
      <section className="bg-white border-b border-neutral-200">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <span>Filters</span>
                  {Object.values(filters).some(v => v.length > 0) && (
                    <span className="ml-2 h-6 w-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm">
                      {filters.caseTypes.length + (filters.minAmount ? 1 : 0) + (filters.maxAmount ? 1 : 0) + (filters.location ? 1 : 0) + (filters.date ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex justify-between items-center">
                    Filters
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear all
                    </Button>
                  </SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Case Type</h3>
                    <div className="space-y-2">
                      {["Car Accident", "Medical Malpractice", "Workplace Injury", "Slip and Fall", "Product Liability"].map((type) => (
                        <div key={type} className="flex items-center">
                          <Checkbox
                            id={type}
                            checked={filters.caseTypes.includes(type)}
                            onCheckedChange={() => handleCaseTypeToggle(type)}
                          />
                          <label htmlFor={type} className="ml-2 text-sm">
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-3">Amount Range</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minAmount}
                        onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxAmount}
                        onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-3">Location</h3>
                    <Input
                      type="text"
                      placeholder="Enter location"
                      value={filters.location}
                      onChange={(e) => handleFilterChange("location", e.target.value)}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-3">Settlement Date</h3>
                    <Input
                      type="month"
                      value={filters.date}
                      onChange={(e) => handleFilterChange("date", e.target.value)}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-3xl font-bold font-display text-primary-900">
              SettlementWins
            </h1>
            <Link to="/submit">
              <Button>
                Submit a Deal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSettlements.map((settlement) => (
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
                    <h3 className="font-bold text-lg text-neutral-900">{settlement.lawyer}</h3>
                    <p className="text-sm text-neutral-600">{settlement.firm}</p>
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

      {/* Value Proposition */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Why Share Your Settlements?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-3">Build Credibility</h3>
                <p className="text-neutral-600">Showcase your track record of success to potential clients</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Attract Cases</h3>
                <p className="text-neutral-600">Help clients understand the value you bring to similar cases</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Network Growth</h3>
                <p className="text-neutral-600">Connect with other successful attorneys in your field</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-primary-900 text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Share Your Success?</h2>
            <p className="text-xl text-primary-100 mb-8">
              Join the leading platform for showcasing legal settlements
            </p>
            <Link to="/submit">
              <Button size="lg" className="bg-white text-primary-900 hover:bg-primary-50">
                Submit Your Settlement <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
