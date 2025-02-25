
import { useState, useMemo } from "react";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import FiltersPanel from "@/components/gallery/FiltersPanel";
import SettlementGrid from "@/components/gallery/SettlementGrid";
import SubmitCTA from "@/components/gallery/SubmitCTA";
import { settlements } from "@/data/settlements";

const Leaderboard = () => {
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

export default Leaderboard;
