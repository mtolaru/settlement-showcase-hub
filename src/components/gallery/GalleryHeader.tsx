
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

  // Predefined static list of locations - focusing on California cities
  const allLocations = [
    "all",
    "Los Angeles, CA",
    "San Francisco, CA",
    "San Diego, CA"
  ];

  return (
    <div className="bg-primary-900 text-white py-12">
      <div className="container">
        <h1 className="text-4xl font-bold font-display mb-4">
          Settlement Leaderboard
        </h1>
        
        <p className="text-lg text-primary-200 mb-8">
          Browse through top-ranked settlements by case type and location. Find industry-leading results and benchmark your success.
        </p>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
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
          
          <Button
            variant="accent"
            size="lg"
            className="whitespace-nowrap font-medium"
          >
            Submit Your Settlement
          </Button>
        </div>
        
        <div className="bg-white rounded-lg p-5">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            {/* Case Types Scroll */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => handleFilterChange("caseType", "all")}
                  className={`
                    whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center
                    ${filters.caseType === "all"
                      ? "bg-primary-600 text-white"
                      : "text-primary-900 border border-neutral-200 hover:bg-neutral-50"
                    }
                  `}
                >
                  {filters.caseType === "all" && (
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  All
                </button>
                
                {allCaseTypes.filter(type => type !== "all").map((type) => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange("caseType", type)}
                    className={`
                      whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center
                      ${type === filters.caseType
                        ? "bg-primary-600 text-white"
                        : "text-primary-900 border border-neutral-200 hover:bg-neutral-50"
                      }
                    `}
                  >
                    {type === filters.caseType && (
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-col gap-3 items-end">
              {/* Location Filter */}
              <select
                className="border border-neutral-200 text-neutral-800 rounded-md px-3 py-2 text-sm w-full sm:w-auto"
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
                className="border border-neutral-200 text-neutral-800 rounded-md px-3 py-2 text-sm w-full sm:w-auto"
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
              >
                <option value="highest">Sort by Amount</option>
                <option value="newest">Most Recent</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default GalleryHeader;
