
import { useState } from "react";
import Hero from "@/components/home/Hero";
import LocationSelector from "@/components/home/LocationSelector";
import SettlementCard from "@/components/home/SettlementCard";
import WhyShare from "@/components/home/WhyShare";
import CallToAction from "@/components/home/CallToAction";
import { settlements } from "@/data/settlements";

const Index = () => {
  const cities = [
    { name: "Los Angeles", active: true },
    { name: "New York", active: false },
    { name: "Miami", active: false },
  ];

  // Format the settlement data to match the SettlementCard props
  const formattedSettlements = settlements.map(settlement => ({
    id: settlement.id,
    type: settlement.type,
    amount: `$${(settlement.amount).toLocaleString()}`,
    lawyer: settlement.attorney,
    firm: settlement.firm,
    firmWebsite: settlement.firmWebsite,
    location: settlement.location,
    date: new Date(settlement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
    photo_url: settlement.photo_url
  }));

  return (
    <div className="w-full">
      <Hero />
      <LocationSelector cities={cities} />
      <section className="py-12 bg-neutral-50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {formattedSettlements.map((settlement) => (
              <SettlementCard key={settlement.id} settlement={settlement} />
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
