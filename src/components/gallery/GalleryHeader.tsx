
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface GalleryHeaderProps {
  settlementCount: number;
  isLoading: boolean;
  filters: {
    amount: string;
    caseType: string;
    location: string;
    sort: string;
  };
  setFilters: (filters: {
    amount: string;
    caseType: string;
    location: string;
    sort: string;
  }) => void;
  caseTypes: string[];
  locations: string[];
}

const GalleryHeader = ({ 
  settlementCount, 
  isLoading, 
  filters, 
  setFilters,
  caseTypes,
  locations 
}: GalleryHeaderProps) => {
  const initialFilters = {
    amount: "all",
    caseType: "all",
    location: "all",
    sort: "highest"
  };

  const handleFilterChange = (type: string, value: string) => {
    setFilters({
      ...filters,
      [type]: value
    });
  };

  const handleReset = () => {
    setFilters(initialFilters);
  };

  // Predefined static list of case types from the submission form
  const allCaseTypes = [
    "all",
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
    "Other"
  ];

  // Predefined static list of locations
  const allLocations = [
    "all",
    "Los Angeles, CA",
    "San Francisco, CA",
    "San Diego, CA",
    "New York, NY",
    "Chicago, IL",
    "Houston, TX",
    "Phoenix, AZ",
    "Philadelphia, PA",
    "San Antonio, TX",
    "Dallas, TX"
  ];

  return (
    <div className="bg-primary-900 text-white py-12">
      <div className="container">
        <h1 className="text-4xl font-bold font-display mb-4">
          Settlements Leaderboard
        </h1>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-y-4">
          <div className="text-primary-200">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading settlements...</span>
              </div>
            ) : (
              <p>
                Showing <span className="font-semibold">{settlementCount}</span>{" "}
                {settlementCount === 1 ? "settlement" : "settlements"}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Case Type Filter */}
            <select
              className="bg-primary-800 text-white rounded-full px-4 py-1 text-sm border border-primary-700"
              value={filters.caseType}
              onChange={(e) => handleFilterChange("caseType", e.target.value)}
            >
              {allCaseTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All Case Types" : type}
                </option>
              ))}
            </select>
            
            {/* Location Filter */}
            <select
              className="bg-primary-800 text-white rounded-full px-4 py-1 text-sm border border-primary-700"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
            >
              {allLocations.map((location) => (
                <option key={location} value={location}>
                  {location === "all" ? "All Locations" : location}
                </option>
              ))}
            </select>
            
            {/* Sort Order */}
            <select
              className="bg-primary-800 text-white rounded-full px-4 py-1 text-sm border border-primary-700"
              value={filters.sort}
              onChange={(e) => handleFilterChange("sort", e.target.value)}
            >
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
              <option value="newest">Most Recent</option>
            </select>
            
            {(filters.caseType !== "all" || filters.location !== "all" || filters.sort !== "highest") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="text-primary-200 hover:text-white text-sm hover:bg-primary-800 rounded-full"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryHeader;
