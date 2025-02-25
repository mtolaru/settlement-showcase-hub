
import { Button } from "@/components/ui/button";

interface FiltersPanelProps {
  caseTypes: string[];
  locations: string[];
  selectedType: string;
  selectedLocation: string;
  sortBy: string;
  onTypeSelect: (type: string) => void;
  onLocationChange: (location: string) => void;
  onSortChange: (sort: string) => void;
}

const FiltersPanel = ({
  caseTypes,
  locations,
  selectedType,
  selectedLocation,
  sortBy,
  onTypeSelect,
  onLocationChange,
  onSortChange,
}: FiltersPanelProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {caseTypes.map((type) => (
            <Button
              key={type}
              variant={selectedType === type.toLowerCase() ? "default" : "outline"}
              onClick={() => onTypeSelect(type.toLowerCase())}
              className="whitespace-nowrap"
            >
              {type}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            className="form-input bg-white border rounded-md px-3 py-2"
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
          >
            {locations.map((location) => (
              <option key={location} value={location}>
                {location === "all" ? "All Locations" : location}
              </option>
            ))}
          </select>
          <select
            className="form-input bg-white border rounded-md px-3 py-2"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="amount">Sort by Amount</option>
            <option value="date">Sort by Date</option>
            <option value="firm">Sort by Firm</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;
