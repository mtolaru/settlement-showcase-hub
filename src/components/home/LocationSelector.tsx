
import { getCities } from "@/lib/locations";

interface LocationSelectorProps {
  cities?: { name: string; active: boolean; location: string }[];
  onCitySelect: (location: string) => void;
  selectedCity: string;
}

const LocationSelector = ({ 
  cities = getCities(), 
  onCitySelect, 
  selectedCity 
}: LocationSelectorProps) => {
  return (
    <section className="bg-neutral-50 border-b border-neutral-200">
      <div className="container py-4">
        <div className="flex justify-center gap-8 flex-wrap">
          {cities.map((city) => (
            <button
              key={city.name}
              onClick={() => {
                if (city.active) {
                  onCitySelect(city.location);
                }
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                city.active && selectedCity === city.location
                  ? "bg-primary-500 text-white"
                  : city.active
                  ? "text-neutral-600 hover:text-primary-500"
                  : "text-neutral-400 cursor-not-allowed"
              }`}
              disabled={!city.active}
              type="button" // Explicitly set type to prevent form submission
            >
              {city.name}
              {!city.active && <span className="ml-2">(Coming Soon)</span>}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LocationSelector;
