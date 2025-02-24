
type City = {
  name: string;
  active: boolean;
};

interface LocationSelectorProps {
  cities: City[];
}

const LocationSelector = ({ cities }: LocationSelectorProps) => {
  return (
    <section className="bg-neutral-50 border-b border-neutral-200">
      <div className="container py-4">
        <div className="flex justify-center gap-8">
          {cities.map((city) => (
            <button
              key={city.name}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                city.active
                  ? "bg-primary-500 text-white"
                  : "text-neutral-400 hover:text-neutral-500"
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
