
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SettlementDetailsFormProps {
  formData: {
    amount: string;
    initialOffer: string;
    policyLimit: string;
    medicalExpenses: string;
    settlementPhase: string;
    caseType: string;
    otherCaseType: string;
    caseDescription: string;
  };
  errors: Record<string, string | undefined>;
  handleInputChange: (field: string, value: string) => void;
}

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

export const SettlementDetailsForm = ({
  formData,
  errors,
  handleInputChange,
}: SettlementDetailsFormProps) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="form-label">Settlement Amount*</label>
        <Input
          type="text"
          value={formData.amount}
          onChange={(e) => handleInputChange("amount", e.target.value)}
          placeholder="1,000,000"
          className="no-spinner"
        />
        {errors.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
        )}
      </div>

      <div>
        <label className="form-label">Initial Settlement Offer*</label>
        <Input
          type="text"
          value={formData.initialOffer}
          onChange={(e) => handleInputChange("initialOffer", e.target.value)}
          placeholder="Enter 0 if no initial offer was made"
          className="no-spinner"
        />
        <p className="text-sm text-neutral-500 mt-1">
          Enter the initial offer received, if any. Enter 0 if none.
        </p>
        {errors.initialOffer && (
          <p className="text-red-500 text-sm mt-1">{errors.initialOffer}</p>
        )}
      </div>

      <div>
        <label className="form-label">Insurance Policy Limit*</label>
        <Input
          type="text"
          value={formData.policyLimit}
          onChange={(e) => handleInputChange("policyLimit", e.target.value)}
          placeholder="Enter 0 if not applicable"
          className="no-spinner"
        />
        {errors.policyLimit && (
          <p className="text-red-500 text-sm mt-1">{errors.policyLimit}</p>
        )}
      </div>

      <div>
        <label className="form-label">Medical Expenses*</label>
        <Input
          type="text"
          value={formData.medicalExpenses}
          onChange={(e) => handleInputChange("medicalExpenses", e.target.value)}
          placeholder="Enter 0 if not applicable"
          className="no-spinner"
        />
        {errors.medicalExpenses && (
          <p className="text-red-500 text-sm mt-1">{errors.medicalExpenses}</p>
        )}
      </div>

      <div>
        <label className="form-label">Settlement Made*</label>
        <select
          className="form-input w-full rounded-md border border-neutral-200 p-2"
          value={formData.settlementPhase}
          onChange={(e) => handleInputChange("settlementPhase", e.target.value)}
        >
          <option value="">Select when settlement was made</option>
          <option value="pre-litigation">Pre-litigation</option>
          <option value="during-litigation">During litigation</option>
        </select>
        {errors.settlementPhase && (
          <p className="text-red-500 text-sm mt-1">{errors.settlementPhase}</p>
        )}
      </div>

      <div>
        <label className="form-label">Case Type*</label>
        <select
          className="form-input w-full rounded-md border border-neutral-200 p-2"
          value={formData.caseType}
          onChange={(e) => handleInputChange("caseType", e.target.value)}
        >
          <option value="">Select Case Type</option>
          {settlementTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.caseType && (
          <p className="text-red-500 text-sm mt-1">{errors.caseType}</p>
        )}
      </div>

      {formData.caseType === "Other" && (
        <div>
          <label className="form-label">Please describe what 'Other' means*</label>
          <Textarea
            value={formData.otherCaseType}
            onChange={(e) => handleInputChange("otherCaseType", e.target.value)}
            placeholder="Please describe the type of case"
          />
          {errors.otherCaseType && (
            <p className="text-red-500 text-sm mt-1">{errors.otherCaseType}</p>
          )}
        </div>
      )}

      <div>
        <label className="form-label">Description of Case</label>
        <Textarea
          value={formData.caseDescription}
          onChange={(e) => handleInputChange("caseDescription", e.target.value)}
          placeholder="Please provide additional details about the case"
        />
      </div>
    </div>
  );
};
