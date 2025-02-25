
import { Input } from "@/components/ui/input";
import ImageUpload from "@/components/ImageUpload";

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
        <Input
          type="text"
          value={formData.location}
          onChange={(e) => handleInputChange("location", e.target.value)}
          placeholder="Los Angeles, CA"
        />
        {errors.location && (
          <p className="text-red-500 text-sm mt-1">{errors.location}</p>
        )}
      </div>
    </div>
  );
};
