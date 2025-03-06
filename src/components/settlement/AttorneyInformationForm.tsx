
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCATIONS } from "@/lib/locations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  clearFormField?: (field: string) => void;
  isValidatingEmail?: boolean;
  emailStatus?: {
    isValidating: boolean;
    alreadyExists: boolean;
  };
  isAuthenticated?: boolean;
  clearedFields?: Set<string>;
}

export const AttorneyInformationForm: React.FC<AttorneyInformationFormProps> = ({
  formData,
  errors,
  handleInputChange,
  handleImageUpload,
  clearFormField,
  emailStatus = { isValidating: false, alreadyExists: false },
  isAuthenticated = false,
  clearedFields = new Set()
}) => {
  const { user } = useAuth();
  const isEmailDisabled = isAuthenticated && user?.email === formData.attorneyEmail;
  const isNamePreFilled = isAuthenticated && Boolean(formData.attorneyName) && !clearedFields.has('attorneyName');
  const hasErrors = Object.values(errors).some(error => error !== undefined);

  // Reset firm information fields
  const handleResetFirmInfo = (field: 'firmName' | 'firmWebsite' | 'attorneyName') => {
    console.log(`Clearing ${field} field`);
    if (clearFormField) {
      clearFormField(field);
    } else {
      handleInputChange(field, '');
    }
  };

  // Prevent event propagation to avoid step navigation issues
  const handleSelectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Attorney Information</h2>

      {hasErrors && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fill in all required fields correctly to proceed.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <div>
          <Label htmlFor="attorneyName">
            Attorney Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="attorneyName"
              value={formData.attorneyName}
              onChange={(e) => handleInputChange("attorneyName", e.target.value)}
              placeholder="John Doe"
              className={`mt-1 ${errors.attorneyName ? "border-red-500" : ""} ${isNamePreFilled ? "pr-10" : "pr-10"}`}
            />
            {formData.attorneyName && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => handleResetFirmInfo('attorneyName')}
                aria-label="Clear attorney name"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Button>
            )}
            {isNamePreFilled && (
              <p className="text-gray-500 text-sm mt-1">Pre-filled from your previous submission</p>
            )}
          </div>
          {errors.attorneyName && (
            <p className="text-red-500 text-sm mt-1">{errors.attorneyName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="attorneyEmail">
            Attorney Email <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="attorneyEmail"
              value={formData.attorneyEmail}
              onChange={(e) => handleInputChange("attorneyEmail", e.target.value)}
              placeholder="john.doe@lawfirm.com"
              className={`mt-1 ${errors.attorneyEmail ? "border-red-500" : ""} pr-10`}
              disabled={isEmailDisabled}
            />
            {isEmailDisabled && (
              <Lock className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/3 text-gray-400" />
            )}
            {!isEmailDisabled && emailStatus.isValidating && (
              <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 transform -translate-y-1/3 text-gray-400" />
            )}
            {!isEmailDisabled && !emailStatus.isValidating && formData.attorneyEmail && !errors.attorneyEmail && (
              <CheckCircle className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/3 text-green-500" />
            )}
            {isEmailDisabled && (
              <CheckCircle className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/3 text-green-500" />
            )}
          </div>
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
          <div className="relative">
            <Input
              id="firmName"
              value={formData.firmName}
              onChange={(e) => handleInputChange("firmName", e.target.value)}
              placeholder="Law Firm LLC"
              className={`mt-1 ${errors.firmName ? "border-red-500" : ""} pr-10`}
            />
            {formData.firmName && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => handleResetFirmInfo('firmName')}
                aria-label="Clear firm name"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Button>
            )}
          </div>
          {errors.firmName && (
            <p className="text-red-500 text-sm mt-1">{errors.firmName}</p>
          )}
          {isAuthenticated && formData.firmName && !clearedFields.has('firmName') && (
            <p className="text-gray-500 text-sm mt-1">Pre-filled from your previous submission</p>
          )}
        </div>

        <div>
          <Label htmlFor="firmWebsite">
            Firm Website <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="firmWebsite"
              value={formData.firmWebsite}
              onChange={(e) => handleInputChange("firmWebsite", e.target.value)}
              placeholder="https://lawfirm.com"
              className={`mt-1 ${errors.firmWebsite ? "border-red-500" : ""} pr-10`}
            />
            {formData.firmWebsite && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => handleResetFirmInfo('firmWebsite')}
                aria-label="Clear firm website"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Button>
            )}
          </div>
          {errors.firmWebsite && (
            <p className="text-red-500 text-sm mt-1">{errors.firmWebsite}</p>
          )}
          {isAuthenticated && formData.firmWebsite && !clearedFields.has('firmWebsite') && (
            <p className="text-gray-500 text-sm mt-1">Pre-filled from your previous submission</p>
          )}
        </div>

        <div>
          <Label htmlFor="location">
            Location <span className="text-red-500">*</span>
          </Label>
          <div onClick={handleSelectClick}>
            <Select
              value={formData.location}
              onValueChange={(value) => handleInputChange("location", value)}
            >
              <SelectTrigger id="location" className={`mt-1 ${errors.location ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.location && (
            <p className="text-red-500 text-sm mt-1">{errors.location}</p>
          )}
        </div>

        <div>
          <Label>
            Attorney Photo <span className="text-red-500">*</span>
          </Label>
          <div className="mt-2">
            <ImageUpload
              onImageUpload={handleImageUpload}
              className="w-full"
            />
          </div>
          {errors.photoUrl && (
            <p className="text-red-500 text-sm mt-1">{errors.photoUrl}</p>
          )}
        </div>
      </div>
    </div>
  );
};
