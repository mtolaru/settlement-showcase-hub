
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

interface AttorneyInformationFormProps {
  formData: {
    attorneyName: string;
    attorneyEmail: string;
    firmName: string;
    firmWebsite: string;
    location: string;
    photoUrl: string;
  };
  errors: {
    [key: string]: string | undefined;
  };
  handleInputChange: (field: string, value: string) => void;
  handleImageUpload: (url: string) => void;
}

export const AttorneyInformationForm: React.FC<AttorneyInformationFormProps> = ({
  formData,
  errors,
  handleInputChange,
  handleImageUpload,
}) => {
  const { isAuthenticated, user } = useAuth();
  const isEmailDisabled = isAuthenticated && user?.email === formData.attorneyEmail;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Attorney Information</h2>

      <div className="space-y-6">
        <div>
          <Label htmlFor="attorneyName">
            Attorney Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="attorneyName"
            value={formData.attorneyName}
            onChange={(e) => handleInputChange("attorneyName", e.target.value)}
            placeholder="John Doe"
            className={`mt-1 ${errors.attorneyName ? "border-red-500" : ""}`}
          />
          {errors.attorneyName && (
            <p className="text-red-500 text-sm mt-1">{errors.attorneyName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="attorneyEmail">
            Attorney Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="attorneyEmail"
            value={formData.attorneyEmail}
            onChange={(e) => handleInputChange("attorneyEmail", e.target.value)}
            placeholder="john.doe@lawfirm.com"
            className={`mt-1 ${errors.attorneyEmail ? "border-red-500" : ""}`}
            disabled={isEmailDisabled}
          />
          {errors.attorneyEmail && (
            <p className="text-red-500 text-sm mt-1">{errors.attorneyEmail}</p>
          )}
          {isEmailDisabled && (
            <p className="text-gray-500 text-sm mt-1">Using email from your account</p>
          )}
        </div>

        <div>
          <Label htmlFor="firmName">
            Firm Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firmName"
            value={formData.firmName}
            onChange={(e) => handleInputChange("firmName", e.target.value)}
            placeholder="Law Firm LLC"
            className={`mt-1 ${errors.firmName ? "border-red-500" : ""}`}
          />
          {errors.firmName && (
            <p className="text-red-500 text-sm mt-1">{errors.firmName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="firmWebsite">Firm Website</Label>
          <Input
            id="firmWebsite"
            value={formData.firmWebsite}
            onChange={(e) => handleInputChange("firmWebsite", e.target.value)}
            placeholder="https://lawfirm.com"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="location">
            Location <span className="text-red-500">*</span>
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            placeholder="San Francisco, CA"
            className={`mt-1 ${errors.location ? "border-red-500" : ""}`}
          />
          {errors.location && (
            <p className="text-red-500 text-sm mt-1">{errors.location}</p>
          )}
        </div>

        <div>
          <Label>Attorney Photo (Optional)</Label>
          <div className="mt-2">
            <ImageUpload
              imageUrl={formData.photoUrl}
              onImageUploaded={handleImageUpload}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
