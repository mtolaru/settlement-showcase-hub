
import { Input } from "@/components/ui/input";
import ImageUpload from "@/components/ImageUpload";
import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";

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
  // Locations that are available for filtering
  const availableLocations = [
    "Los Angeles, CA",
    "San Francisco, CA",
    "San Diego, CA"
  ];
  
  const [otherLocation, setOtherLocation] = useState("");
  const [showOtherLocationInput, setShowOtherLocationInput] = useState(
    formData.location !== "" && !availableLocations.includes(formData.location)
  );
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Prevent form submission when Enter key is pressed
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Form submission prevented");
    return false;
  };

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

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    handleInputChange("attorneyEmail", email);
    
    // Clear any previous timeout
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }
    
    // Skip validation for empty or clearly invalid emails
    if (!email || !email.includes('@') || !email.includes('.')) {
      return;
    }
    
    // Set a timeout to avoid too many API calls while typing
    setIsCheckingEmail(true);
    const timeout = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('settlements')
          .select('attorney_email')
          .eq('attorney_email', email)
          .maybeSingle();
        
        if (error) throw error;
        
        // If we found data with this email, it already exists
        if (data) {
          handleInputChange("attorneyEmail", email); // Update the value
          // The error will be set in the parent component
        }
      } catch (error) {
        console.error('Error checking email:', error);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500); // 500ms debounce
    
    setEmailCheckTimeout(timeout);
  };

  // Handle key press to prevent form submission on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      return false;
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }
    };
  }, [emailCheckTimeout]);

  // Determine the current selection value for the dropdown
  const getSelectedValue = () => {
    if (!formData.location) return "";
    if (availableLocations.includes(formData.location)) return formData.location;
    if (formData.location && !availableLocations.includes(formData.location)) return "other";
    return "";
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div>
        <label className="form-label">Attorney Name*</label>
        <Input
          type="text"
          value={formData.attorneyName}
          onChange={(e) => handleInputChange("attorneyName", e.target.value)}
          placeholder="John Smith"
          onKeyDown={handleKeyDown}
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
          onChange={handleEmailChange}
          placeholder="john@example.com"
          className={isCheckingEmail ? "bg-neutral-50" : ""}
          onKeyDown={handleKeyDown}
        />
        {isCheckingEmail && (
          <p className="text-neutral-500 text-sm mt-1">Checking email...</p>
        )}
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
          onKeyDown={handleKeyDown}
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
          onKeyDown={handleKeyDown}
        />
        {errors.firmWebsite && (
          <p className="text-red-500 text-sm mt-1">{errors.firmWebsite}</p>
        )}
      </div>

      <div>
        <label className="form-label">Location*</label>
        <select
          className="form-input w-full rounded-md border border-neutral-200 p-2"
          value={getSelectedValue()}
          onChange={handleLocationChange}
          onKeyDown={handleKeyDown}
        >
          <option value="">Select your location</option>
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
              onKeyDown={handleKeyDown}
            />
          </div>
        )}
        {errors.location && (
          <p className="text-red-500 text-sm mt-1">{errors.location}</p>
        )}
      </div>
    </form>
  );
};
