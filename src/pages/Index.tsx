import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, Filter, Share2, ArrowRight, Building2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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

  const handleSettlementClick = (id: number) => {
    navigate(`/settlements/${id}`);
  };

  return (
    <div className="w-full">
      <section className="bg-white pt-20 pb-24">
        <div className="container max-w-6xl mx-auto text-center">
          <h1 className="text-[4rem] leading-tight font-bold font-display text-neutral-900 mb-6">
            WE GIVE CREDIT
            <br />
            WHERE CREDIT IS DUE
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-12">
            Share your success, generate more leads, discover settlements —
            fast, simple, impactful. Democratizing legal wins, one settlement at a time.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-16">
            <Link to="/submit">
              <Button 
                className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-2 text-base h-11"
              >
                Submit Settlement
              </Button>
            </Link>
            <Link to="/settlements">
              <Button 
                variant="outline" 
                className="px-6 py-2 text-base h-11"
              >
                Browse Settlements
              </Button>
            </Link>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search settlements, firms, or case types..."
                className="w-full pl-10 pr-4 py-3 text-lg bg-white border-2 border-neutral-200 focus:border-primary-500 rounded-lg shadow-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            </div>
          </div>
        </div>
      </section>

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

      <section className="py-12 bg-neutral-50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSettlements.map((settlement) => (
              <motion.div
                key={settlement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSettlementClick(settlement.id)}
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-neutral-500 hover:text-primary-500"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-neutral-900">
                      {settlement.lawyer}
                    </h3>
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
