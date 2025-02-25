
import { useState } from "react";
import Hero from "@/components/home/Hero";
import LocationSelector from "@/components/home/LocationSelector";
import SettlementCard from "@/components/home/SettlementCard";
import WhyShare from "@/components/home/WhyShare";
import CallToAction from "@/components/home/CallToAction";

const Index = () => {
  const cities = [
    { name: "Los Angeles", active: true },
    { name: "New York", active: false },
    { name: "Miami", active: false },
  ];

  const settlements = [
    {
      id: 1,
      image: "/placeholder.svg",
      type: "Motor Vehicle Accidents",
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
      type: "Premises Liability",
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
      type: "Motor Vehicle Accidents",
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
      type: "Premises Liability",
      amount: "$1.1M",
      lawyer: "Maria Garcia",
      firm: "Garcia Law Firm",
      location: "Los Angeles, CA",
      date: "February 2024",
    },
  ];

  return (
    <div className="w-full">
      <Hero />
      <LocationSelector cities={cities} />
      <section className="py-12 bg-neutral-50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {settlements.map((settlement) => (
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
