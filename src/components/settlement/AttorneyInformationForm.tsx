
import { Input } from "@/components/ui/input";
import ImageUpload from "@/components/ImageUpload";
import { useState } from "react";

interface AttorneyInformationFormProps {
  formData: {
    attorneyName: string;
    attorneyEmail: string;
    firmName: string;
    firmWebsite: string;
    location: string;
    photoUrl: string;
  };
  errors: Record<string, string | undefined>;
  handleInputChange: (field: string, value: string) => void;
  handleImageUpload: (url: string) => void;
}

export const AttorneyInformationForm = ({
  formData,
  errors,
  handleInputChange,
  handleImageUpload,
}: AttorneyInformationFormProps) => {
  const [otherLocation, setOtherLocation] = useState("");
  const [showOtherLocationInput, setShowOtherLocationInput] = useState(formData.location !== "" && !availableLocations.includes(formData.location));

  // Locations that are available for filtering
  const availableLocations = [
    "Los Angeles, CA",
    "San Francisco, CA",
    "New York, NY",
    "Chicago, IL",
    "Miami, FL",
    "Dallas, TX",
    "Houston, TX",
    "Seattle, WA",
    "Boston, MA",
    "Philadelphia, PA",
    "Washington, DC"
  ];

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "other") {
      setShowOtherLocationInput(true);
      // Don't update the formData location yet, wait for the user to input the custom location
    } else {
      setShowOtherLocationInput(false);
      handleInputChange("location", value);
    }
  };

  const handleOtherLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherLocation(value);
    handleInputChange("location", value);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="form-label">Attorney Name*</label>
        <Input
          type="text"
          value={formData.attorneyName}
          onChange={(e) => handleInputChange("attorneyName", e.target.value)}
          placeholder="John Smith"
        />
        {errors.attorneyName && (
          <p className="text-red-500 text-sm mt-1">{errors.attorneyName}</p>
        )}
      </div>

      <div>
        <label className="form-label">Professional Photo</label>
        <p className="text-sm text-neutral-600 mb-2">
          Upload a professional headshot to be displayed with your settlement
        </p>
        <ImageUpload onImageUpload={handleImageUpload} />
      </div>

      <div>
        <label className="form-label">Email*</label>
        <Input
          type="email"
          value={formData.attorneyEmail}
          onChange={(e) => handleInputChange("attorneyEmail", e.target.value)}
          placeholder="john@example.com"
        />
        {errors.attorneyEmail && (
          <p className="text-red-500 text-sm mt-1">{errors.attorneyEmail}</p>
        )}
      </div>

      <div>
        <label className="form-label">Law Firm*</label>
        <Input
          type="text"
          value={formData.firmName}
          onChange={(e) => handleInputChange("firmName", e.target.value)}
          placeholder="Smith & Associates"
        />
        {errors.firmName && (
          <p className="text-red-500 text-sm mt-1">{errors.firmName}</p>
        )}
      </div>

      <div>
        <label className="form-label">Law Firm Website*</label>
        <Input
          type="url"
          value={formData.firmWebsite}
          onChange={(e) => handleInputChange("firmWebsite", e.target.value)}
          placeholder="https://www.example.com"
        />
        {errors.firmWebsite && (
          <p className="text-red-500 text-sm mt-1">{errors.firmWebsite}</p>
        )}
      </div>

      <div>
        <label className="form-label">Location*</label>
        <select
          className="form-input w-full rounded-md border border-neutral-200 p-2"
          value={availableLocations.includes(formData.location) ? formData.location : "other"}
          onChange={handleLocationChange}
        >
          <option value="">Select Location</option>
          {availableLocations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
          <option value="other">Other</option>
        </select>
        {showOtherLocationInput && (
          <div className="mt-2">
            <Input
              type="text"
              value={otherLocation || formData.location}
              onChange={handleOtherLocationChange}
              placeholder="Please specify your location (City, State)"
            />
          </div>
        )}
        {errors.location && (
          <p className="text-red-500 text-sm mt-1">{errors.location}</p>
        )}
      </div>
    </div>
  );
};
