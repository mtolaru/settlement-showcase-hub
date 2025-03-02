
import { SelectField } from "../form-fields/SelectField";
import { TextareaField } from "../form-fields/TextareaField";

const settlementTypes = [
  "Motor Vehicle Accidents",
  "Medical Malpractice",
  "Product Liability",
  "Premises Liability",
  "Wrongful Death",
  "Animal Attack",
  "Assault and Abuse",
  "Boating Accidents",
  "Slip & Fall",
  "Workplace Injury",
  "Other"
];

interface CaseDetailsSectionProps {
  formData: {
    settlementPhase: string;
    caseType: string;
    otherCaseType: string;
    caseDescription: string;
  };
  errors: Record<string, string | undefined>;
  handleInputChange: (field: string, value: string) => void;
}

export const CaseDetailsSection = ({
  formData,
  errors,
  handleInputChange,
}: CaseDetailsSectionProps) => {
  const settlementPhaseOptions = [
    { value: "pre-litigation", label: "Pre-litigation" },
    { value: "during-litigation", label: "During litigation" },
  ];

  const caseTypeOptions = settlementTypes.map(type => ({
    value: type,
    label: type
  }));

  return (
    <div className="space-y-6">
      <SelectField
        label="Settlement Made*"
        value={formData.settlementPhase}
        onChange={(value) => handleInputChange("settlementPhase", value)}
        options={settlementPhaseOptions}
        placeholder="Select when settlement was made"
        error={errors.settlementPhase}
      />

      <SelectField
        label="Case Type*"
        value={formData.caseType}
        onChange={(value) => handleInputChange("caseType", value)}
        options={caseTypeOptions}
        placeholder="Select Case Type"
        error={errors.caseType}
      />

      {formData.caseType === "Other" && (
        <TextareaField
          label="Please describe what 'Other' means*"
          value={formData.otherCaseType}
          onChange={(value) => handleInputChange("otherCaseType", value)}
          placeholder="Please describe the type of case"
          error={errors.otherCaseType}
        />
      )}

      <TextareaField
        label="Description of Case*"
        value={formData.caseDescription}
        onChange={(value) => handleInputChange("caseDescription", value)}
        placeholder="Please provide details about the case. This description will be publicly displayed on the settlement page."
        error={errors.caseDescription}
      />
    </div>
  );
};
