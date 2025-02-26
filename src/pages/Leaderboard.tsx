
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import FiltersPanel from "@/components/gallery/FiltersPanel";
import SettlementGrid from "@/components/gallery/SettlementGrid";
import SubmitCTA from "@/components/gallery/SubmitCTA";
import { settlements } from "@/data/settlements";

const Leaderboard = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("amount");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  // Reset filters when search query is present
  useEffect(() => {
    if (searchQuery) {
      setSelectedType("all");
      setSelectedLocation("all");
    }
  }, [searchQuery]);

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

    // Apply search filter if query exists
    if (searchQuery) {
      filtered = filtered.filter((settlement) => {
        const searchFields = [
          settlement.type.toLowerCase(),
          settlement.firm.toLowerCase(),
          settlement.location.toLowerCase(),
          settlement.description?.toLowerCase() || "",
          settlement.case_description?.toLowerCase() || "",
        ];
        return searchFields.some(field => field.includes(searchQuery));
      });
    } else {
      // Apply regular filters only if no search query
      if (selectedType.toLowerCase() !== "all") {
        filtered = filtered.filter(
          (settlement) => settlement.type.toLowerCase() === selectedType.toLowerCase()
        );
      }

      if (selectedLocation.toLowerCase() !== "all") {
        filtered = filtered.filter(
          (settlement) => settlement.location === selectedLocation
        );
      }
    }

    // Sort settlements
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return b.amount - a.amount;
        case "date":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [settlements, selectedType, selectedLocation, sortBy, searchQuery]);

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
