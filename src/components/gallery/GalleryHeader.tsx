
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getLocationOptions } from "@/lib/locations";

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

  // Use the centralized locations
  const allLocations = ["all", ...locations];
  const locationOptions = getLocationOptions(true);

  return (
    <div className="bg-primary-900 text-white py-12">
      <div className="container">
        <h1 className="text-4xl font-bold font-display mb-4">
          Settlements Leaderboard
        </h1>
        
        <div className="flex flex-col gap-y-6">
          {/* Case Types Scroll */}
          <div className="relative">
            <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
              {allCaseTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilterChange("caseType", type)}
                  className={`
                    whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${type === filters.caseType
                      ? "bg-white text-primary-900"
                      : "text-white border border-primary-700 hover:bg-primary-800"
                    }
                  `}
                  type="button"
                >
                  {type === "all" ? "All Case Types" : type}
                </button>
              ))}
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
              {/* Location Filter */}
              <select
                className="bg-primary-800 text-white rounded-full px-4 py-1.5 text-sm border border-primary-700"
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
              >
                {locationOptions.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
              
              {/* Sort Order */}
              <select
                className="bg-primary-800 text-white rounded-full px-4 py-1.5 text-sm border border-primary-700"
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
                  type="button"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        `}
      </style>
    </div>
  );
};

export default GalleryHeader;
