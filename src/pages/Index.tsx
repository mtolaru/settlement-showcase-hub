
import { useState } from "react";
import Hero from "@/components/home/Hero";
import LocationSelector from "@/components/home/LocationSelector";
import SettlementCard from "@/components/home/SettlementCard";
import WhyShare from "@/components/home/WhyShare";
import CallToAction from "@/components/home/CallToAction";
import { settlements } from "@/data/settlements";
import { ArrowRight } from "lucide-react";
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
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Recent Settlements</h2>
              <p className="text-neutral-600">Latest cases and victories from our community</p>
            </div>
            <Link to="/settlements">
              <Button variant="outline" className="group">
                View All Settlements
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentSettlements.map((settlement) => (
              <SettlementCard 
                key={settlement.id} 
                settlement={formatSettlement(settlement)} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Top Settlements Section */}
      <section className="py-12 bg-white">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Top Settlements</h2>
              <p className="text-neutral-600">Highest value settlements in our database</p>
            </div>
            <Link to="/settlements">
              <Button variant="outline" className="group">
                Explore More
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topSettlements.map((settlement) => (
              <SettlementCard 
                key={settlement.id} 
                settlement={formatSettlement(settlement)} 
              />
            ))}
          </div>
        </div>
      </section>

      <WhyShare />
      <CallToAction />
    </div>
  );
};

export default Index;
