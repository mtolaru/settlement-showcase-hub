
import { useState } from "react";
import Hero from "@/components/home/Hero";
import LocationSelector from "@/components/home/LocationSelector";
import SettlementCard from "@/components/home/SettlementCard";
import WhyShare from "@/components/home/WhyShare";
import CallToAction from "@/components/home/CallToAction";
import { settlements } from "@/data/settlements";
import { ArrowRight, Trophy, Clock, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const [selectedCity, setSelectedCity] = useState("all");
  
  const cities = [
    { name: "All Cities", active: true, location: "all" },
    { name: "San Francisco", active: true, location: "San Francisco, CA" },
    { name: "San Diego", active: true, location: "San Diego, CA" },
    { name: "Los Angeles", active: true, location: "Los Angeles, CA" },
  ];

  // Sort settlements by date for recent cases
  const recentSettlements = [...settlements]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(settlement => selectedCity === "all" || settlement.location === selectedCity)
    .slice(0, 3);

  // Sort settlements by amount for top settlements
  const topSettlements = [...settlements]
    .sort((a, b) => b.amount - a.amount)
    .filter(settlement => selectedCity === "all" || settlement.location === selectedCity)
    .slice(0, 3);

  // Format the settlement data to match the SettlementCard props
  const formatSettlement = (settlement: typeof settlements[0]) => ({
    id: settlement.id,
    type: settlement.type,
    amount: `$${(settlement.amount).toLocaleString()}`,
    lawyer: settlement.attorney,
    firm: settlement.firm,
    firmWebsite: settlement.firmWebsite,
    location: settlement.location,
    date: new Date(settlement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
    photo_url: settlement.photo_url
  });

  const EmptyState = ({ type }: { type: "recent" | "top" }) => (
    <div className="col-span-1 md:col-span-3 py-16 flex flex-col items-center justify-center bg-white rounded-lg border border-dashed border-neutral-300">
      <FileQuestion className="h-12 w-12 text-neutral-400 mb-4" />
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        No {type === "recent" ? "Recent" : "Top"} Settlements Found
      </h3>
      <p className="text-neutral-600 text-center max-w-md mb-6">
        {type === "recent" 
          ? "There are no recent settlements in this location yet." 
          : "There are no top settlements in this location yet."}
      </p>
      <Link to="/submit">
        <Button variant="outline">
          Submit Your Settlement
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="w-full">
      <Hero />
      <LocationSelector 
        cities={cities} 
        onCitySelect={setSelectedCity}
        selectedCity={selectedCity}
      />

      {/* Recent Settlements Section */}
      <section className="py-12 bg-neutral-50">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary-500" />
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Recent Settlements</h2>
                <p className="text-neutral-600">Latest cases and victories from our community</p>
              </div>
            </div>
            <Link to="/settlements">
              <Button variant="outline" className="group">
                View More
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentSettlements.length > 0 ? (
              recentSettlements.map((settlement) => (
                <SettlementCard 
                  key={settlement.id} 
                  settlement={formatSettlement(settlement)} 
                />
              ))
            ) : (
              <EmptyState type="recent" />
            )}
          </div>
        </div>
      </section>

      {/* Top Settlements Section */}
      <section className="py-12 bg-primary-900 text-white">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-accent-300" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Top Settlements</h2>
                <p className="text-primary-200">Highest value settlements in our database</p>
              </div>
            </div>
            <Link to="/settlements">
              <Button 
                variant="outline" 
                className="group border-white text-white hover:bg-white hover:text-primary-900"
              >
                View More
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topSettlements.length > 0 ? (
              topSettlements.map((settlement) => (
                <SettlementCard 
                  key={settlement.id} 
                  settlement={formatSettlement(settlement)} 
                />
              ))
            ) : (
              <EmptyState type="top" />
            )}
          </div>
        </div>
      </section>

      <WhyShare />
      <CallToAction />
    </div>
  );
};

export default Index;
