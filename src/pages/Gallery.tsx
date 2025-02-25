
import { useState, useMemo } from "react";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import FiltersPanel from "@/components/gallery/FiltersPanel";
import SettlementGrid from "@/components/gallery/SettlementGrid";
import SubmitCTA from "@/components/gallery/SubmitCTA";

// Shared settlement data to ensure consistency
export const settlements = [
  {
    id: 1,
    amount: 2500000,
    type: "Motor Vehicle Accidents",
    firm: "Smith & Associates",
    firmWebsite: "https://www.smithassociates.com",
    attorney: "Sarah Johnson",
    location: "Los Angeles, CA",
    date: "2024-03-15",
    description: "Successful resolution of a complex motor vehicle accident case resulting in severe injuries to our client. Settlement achieved through strategic negotiation and comprehensive evidence presentation.",
    details: {
      initialOffer: "$1,500,000",
      policyLimit: "$3,000,000",
      medicalExpenses: "$750,000",
      settlementPhase: "during-litigation",
      caseDescription: "Multi-vehicle collision resulting in severe injuries"
    }
  },
  {
    id: 2,
    amount: 3100000,
    type: "Medical Malpractice",
    firm: "Johnson Legal Group",
    firmWebsite: "https://www.johnsonlegal.com",
    attorney: "Michael Chen",
    location: "San Francisco, CA",
    date: "2024-02-20",
    description: "Resolution of a complex medical malpractice case involving surgical complications. Settlement achieved through expert testimony and detailed documentation of care standards violations.",
    details: {
      initialOffer: "$1,800,000",
      policyLimit: "$5,000,000",
      medicalExpenses: "$950,000",
      settlementPhase: "pre-litigation",
      caseDescription: "Surgical error leading to permanent disability"
    }
  },
  {
    id: 3,
    amount: 1800000,
    type: "Premises Liability",
    firm: "Pacific Law Partners",
    firmWebsite: "https://www.pacificlawpartners.com",
    attorney: "David Martinez",
    location: "Los Angeles, CA",
    date: "2024-01-10",
    description: "Successfully settled premises liability case involving hazardous conditions at a commercial property. Case resolved through mediation and comprehensive documentation of safety violations.",
    details: {
      initialOffer: "$800,000",
      policyLimit: "$2,000,000",
      medicalExpenses: "$450,000",
      settlementPhase: "during-litigation",
      caseDescription: "Fall incident at commercial property"
    }
  },
  {
    id: 4,
    amount: 4200000,
    type: "Product Liability",
    firm: "West Coast Legal",
    firmWebsite: "https://www.westcoastlegal.com",
    attorney: "Emily Rodriguez",
    location: "Los Angeles, CA",
    date: "2024-01-05",
    description: "Major product liability settlement involving defective consumer products. Case resolved through extensive expert testimony and product testing evidence.",
    details: {
      initialOffer: "$2,500,000",
      policyLimit: "$5,000,000",
      medicalExpenses: "$1,200,000",
      settlementPhase: "during-litigation",
      caseDescription: "Product malfunction causing severe burns"
    }
  }
];

const Gallery = () => {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("amount");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const caseTypes = [
    "All",
    "Motor Vehicle Accidents",
    "Medical Malpractice",
    "Product Liability",
    "Premises Liability",
    "Wrongful Death",
    "Animal Attack",
    "Assault and Abuse",
    "Boating Accidents",
    "Slip & Fall",
    "Workplace Injury",
  ];

  const locations = [
    "All",
    "Los Angeles, CA",
    "San Francisco, CA",
    "San Diego, CA",
  ];

  // Filter and sort settlements
  const filteredSettlements = useMemo(() => {
    let filtered = [...settlements];

    // Filter by type
    if (selectedType.toLowerCase() !== "all") {
      filtered = filtered.filter(
        (settlement) => settlement.type.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Filter by location
    if (selectedLocation.toLowerCase() !== "all") {
      filtered = filtered.filter(
        (settlement) => settlement.location === selectedLocation
      );
    }

    // Sort settlements
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return b.amount - a.amount;
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "firm":
          return a.firm.localeCompare(b.firm);
        default:
          return 0;
      }
    });
  }, [settlements, selectedType, selectedLocation, sortBy]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <GalleryHeader />
      <div className="container py-8">
        <FiltersPanel
          caseTypes={caseTypes}
          locations={locations}
          selectedType={selectedType}
          selectedLocation={selectedLocation}
          sortBy={sortBy}
          onTypeSelect={setSelectedType}
          onLocationChange={setSelectedLocation}
          onSortChange={setSortBy}
        />
        <SettlementGrid settlements={filteredSettlements} />
        <SubmitCTA />
      </div>
    </div>
  );
};

export default Gallery;
