
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type City = {
  name: string;
  active: boolean;
  location: string;
};

interface LocationSelectorProps {
  cities: City[];
  onCitySelect: (location: string) => void;
  selectedCity: string;
}

const LocationSelector = ({ cities, onCitySelect, selectedCity }: LocationSelectorProps) => {
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
