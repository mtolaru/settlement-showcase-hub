
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export interface FiltersPanelProps {
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

const FiltersPanel = ({ filters, setFilters, caseTypes, locations }: FiltersPanelProps) => {
  const [sliderValue, setSliderValue] = useState<number[]>([0]);
  
  const amountRanges = [
    { label: "All Amounts", value: "all" },
    { label: "$0 - $50,000", value: "0-50000" },
    { label: "$50,000 - $100,000", value: "50000-100000" },
    { label: "$100,000 - $250,000", value: "100000-250000" },
    { label: "$250,000 - $500,000", value: "250000-500000" },
    { label: "$500,000 - $1,000,000", value: "500000-1000000" },
    { label: "$1,000,000+", value: "1000000" },
  ];
  
  const sortOptions = [
    { label: "Highest Amount", value: "highest" },
    { label: "Lowest Amount", value: "lowest" },
    { label: "Most Recent", value: "newest" },
  ];

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
  
  const handleReset = () => {
    setFilters({
      amount: "all",
      caseType: "all",
      location: "all",
      sort: "highest"
    });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters({
      ...filters,
      [filterType]: value
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Detailed Filters</h3>
        <button 
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          onClick={handleReset}
        >
          Reset All
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Settlement Amount Filter */}
        <div>
          <h4 className="text-sm font-medium mb-3">Settlement Amount</h4>
          <div className="space-y-2">
            {amountRanges.map((range) => (
              <div key={range.value} className="flex items-center">
                <input
                  type="radio"
                  id={`amount-${range.value}`}
                  name="amount"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  checked={filters.amount === range.value}
                  onChange={() => handleFilterChange("amount", range.value)}
                />
                <label 
                  htmlFor={`amount-${range.value}`} 
                  className="ml-2 text-sm text-neutral-700"
                >
                  {range.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Case Type Filter */}
        <div>
          <h4 className="text-sm font-medium mb-3">Case Type</h4>
          <select
            className="w-full rounded-md border border-neutral-200 p-2 text-sm"
            value={filters.caseType}
            onChange={(e) => handleFilterChange("caseType", e.target.value)}
          >
            {allCaseTypes.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? "All Case Types" : type}
              </option>
            ))}
          </select>
        </div>
        
        {/* Location Filter */}
        <div>
          <h4 className="text-sm font-medium mb-3">Location</h4>
          <select
            className="w-full rounded-md border border-neutral-200 p-2 text-sm"
            value={filters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
          >
            {allLocations.map((location) => (
              <option key={location} value={location}>
                {location === "all" ? "All Locations" : location}
              </option>
            ))}
          </select>
        </div>
        
        {/* Sort Order */}
        <div>
          <h4 className="text-sm font-medium mb-3">Sort By</h4>
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`sort-${option.value}`}
                  name="sort"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  checked={filters.sort === option.value}
                  onChange={() => handleFilterChange("sort", option.value)}
                />
                <label 
                  htmlFor={`sort-${option.value}`} 
                  className="ml-2 text-sm text-neutral-700"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;
