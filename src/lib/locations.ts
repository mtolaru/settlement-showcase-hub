
// Centralized list of locations for use throughout the application
export const LOCATIONS = [
  "San Francisco, CA",
  "Los Angeles, CA",
  "San Diego, CA"
];

// Helper function to get all locations with option to include an "all" option
export const getLocations = (includeAll: boolean = false): string[] => {
  return includeAll ? ["all", ...LOCATIONS] : [...LOCATIONS];
};

// Helper function to get locations with labels for dropdowns/selects
export const getLocationOptions = (includeAll: boolean = false): { value: string; label: string }[] => {
  const locations = getLocations(includeAll);
  
  return locations.map(location => ({
    value: location,
    label: location === "all" ? "All Locations" : location
  }));
};

// Helper function to get cities for the homepage
export const getCities = (): { name: string; active: boolean; location: string }[] => {
  return [
    { name: "All Cities", active: true, location: "all" },
    { name: "San Francisco", active: true, location: "San Francisco, CA" },
    { name: "Los Angeles", active: true, location: "Los Angeles, CA" },
    { name: "San Diego", active: true, location: "San Diego, CA" },
  ];
};
