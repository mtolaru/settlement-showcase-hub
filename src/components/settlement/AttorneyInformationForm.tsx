import React, { useEffect } from "react";
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
  
  // Only disable the email field if user is authenticated AND using their own email
  const isEmailDisabled = isAuthenticated && user?.email === formData.attorneyEmail;
  const isNamePreFilled = isAuthenticated && Boolean(formData.attorneyName) && !clearedFields.has('attorneyName');
  
  const hasFormErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    console.log("AttorneyInformationForm render:", { 
      isAuthenticated, 
      userEmail: user?.email, 
      formEmail: formData.attorneyEmail,
      isEmailDisabled
    });
  }, [isAuthenticated, user, formData.attorneyEmail, isEmailDisabled]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Attorney Information</h2>

      {hasFormErrors && (
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
            {formData.attorneyName && clearFormField && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => clearFormField('attorneyName')}
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
              readOnly={isEmailDisabled}
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
          </div>
          {errors.attorneyEmail && (
            <p className="text-red-500 text-sm mt-1">{errors.attorneyEmail}</p>
          )}
          {isEmailDisabled && (
            <p className="text-gray-500 text-sm mt-1">Using email from your account</p>
          )}
          {!isEmailDisabled && emailStatus.alreadyExists && (
            <p className="text-amber-500 text-sm mt-1">This email is already registered. Consider signing in.</p>
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
              className={`mt-1 ${errors.firmName ? "border-red-500" : ""}`}
            />
          </div>
          {errors.firmName && (
            <p className="text-red-500 text-sm mt-1">{errors.firmName}</p>
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
              className={`mt-1 ${errors.firmWebsite ? "border-red-500" : ""}`}
            />
          </div>
          {errors.firmWebsite && (
            <p className="text-red-500 text-sm mt-1">{errors.firmWebsite}</p>
          )}
        </div>

        <div>
          <Label htmlFor="location">
            Location <span className="text-red-500">*</span>
          </Label>
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
