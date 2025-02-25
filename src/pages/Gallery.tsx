
import { useState, useMemo } from "react";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import FiltersPanel from "@/components/gallery/FiltersPanel";
import SettlementGrid from "@/components/gallery/SettlementGrid";
import SubmitCTA from "@/components/gallery/SubmitCTA";

const Gallery = () => {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("amount");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const caseTypes = [
    "All",
    "Motor Vehicle Accidents",
    "Medical Malpractice",
    "Product Liability",
    "Premise",
    "Animal Attack",
    "Wrongful Death",
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

  // Sample data - would come from API in production
  const settlements = [
    {
      id: 1,
      amount: 2500000,
      type: "Motor Vehicle Accidents",
      firm: "Smith & Associates",
      location: "Los Angeles, CA",
      date: "2024-03-15",
    },
    {
      id: 2,
      amount: 1800000,
      type: "Medical Malpractice",
      firm: "Johnson Legal Group",
      location: "San Francisco, CA",
      date: "2024-02-20",
    },
    {
      id: 3,
      amount: 950000,
      type: "Product Liability",
      firm: "Roberts & Partners",
      location: "San Diego, CA",
      date: "2024-01-10",
    },
    {
      id: 4,
      amount: 1200000,
      type: "Wrongful Death",
      firm: "Wilson Law Group",
      location: "Los Angeles, CA",
      date: "2024-01-05",
    },
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
