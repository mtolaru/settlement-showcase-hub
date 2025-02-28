
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

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
    settlementDate: string;
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
  const [focused, setFocused] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState<string>("");

  const formatDollarInput = (value: string) => {
    // Remove dollar sign and commas
    let numericValue = value.replace(/[$,]/g, '');
    
    // If empty, return empty string
    if (!numericValue) return '';
    
    // Format with dollar sign and commas
    return `$${numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handleDollarInput = (field: string, value: string) => {
    // Remove dollar sign for processing
    const processedValue = value.replace(/[$,]/g, '');
    handleInputChange(field, processedValue);
  };
  
  const formatDateInput = (value: string) => {
    // Remove any non-digits
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
  };
  
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Format the date for display
    const formatted = formatDateInput(value);
    setDisplayDate(formatted);
    
    // Convert MM/DD/YYYY to YYYY-MM-DD for storage if complete
    const digits = value.replace(/\D/g, '');
    if (digits.length === 8) {
      const month = digits.slice(0, 2);
      const day = digits.slice(2, 4);
      const year = digits.slice(4, 8);
      const isoDate = `${year}-${month}-${day}`;
      handleInputChange("settlementDate", isoDate);
    } else {
      // Just keep the formatted value if not complete
      handleInputChange("settlementDate", formatted);
    }
  };
  
  const handleDateFocus = () => {
    setFocused("settlementDate");
    // If we have an ISO date, convert to MM/DD/YYYY for display
    if (formData.settlementDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = formData.settlementDate.split('-');
      setDisplayDate(`${month}/${day}/${year}`);
    } else if (formData.settlementDate.includes('/')) {
      setDisplayDate(formData.settlementDate);
    } else {
      setDisplayDate("");
    }
  };
  
  const handleDateBlur = () => {
    setFocused(null);
    
    // If we have a full date in MM/DD/YYYY format, convert to YYYY-MM-DD
    const match = displayDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const [_, month, day, year] = match;
      const isoDate = `${year}-${month}-${day}`;
      handleInputChange("settlementDate", isoDate);
    }
  };

  // Convert ISO date to display format when component mounts or formData changes
  useEffect(() => {
    if (formData.settlementDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = formData.settlementDate.split('-');
      setDisplayDate(`${month}/${day}/${year}`);
    } else if (formData.settlementDate.includes('/')) {
      setDisplayDate(formData.settlementDate);
    }
  }, [formData.settlementDate]);

  return (
    <div className="space-y-6">
      <div>
        <label className="form-label">Settlement Amount*</label>
        <Input
          type="text"
          value={formatDollarInput(formData.amount)}
          onChange={(e) => handleDollarInput("amount", e.target.value)}
          placeholder="$1,000,000"
          className="no-spinner"
        />
        {errors.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
        )}
      </div>

      <div>
        <label className="form-label">Settlement Date*</label>
        <Input
          type="text"
          value={focused === "settlementDate" ? displayDate : (displayDate || getDisplayDate(formData.settlementDate))}
          onChange={handleDateInput}
          onFocus={handleDateFocus}
          onBlur={handleDateBlur}
          placeholder="MM/DD/YYYY"
          className="no-spinner"
        />
        <p className="text-sm text-neutral-500 mt-1">
          Enter the date when the settlement was finalized
        </p>
        {errors.settlementDate && (
          <p className="text-red-500 text-sm mt-1">{errors.settlementDate}</p>
        )}
      </div>

      <div>
        <label className="form-label">Initial Settlement Offer*</label>
        <Input
          type="text"
          value={formatDollarInput(formData.initialOffer)}
          onChange={(e) => handleDollarInput("initialOffer", e.target.value)}
          placeholder="$0"
          className="no-spinner"
        />
        <p className="text-sm text-neutral-500 mt-1">
          Enter the initial offer received, if any. Enter $0 if none.
        </p>
        {errors.initialOffer && (
          <p className="text-red-500 text-sm mt-1">{errors.initialOffer}</p>
        )}
      </div>

      <div>
        <label className="form-label">Insurance Policy Limit*</label>
        <Input
          type="text"
          value={formatDollarInput(formData.policyLimit)}
          onChange={(e) => handleDollarInput("policyLimit", e.target.value)}
          placeholder="$0"
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
          value={formatDollarInput(formData.medicalExpenses)}
          onChange={(e) => handleDollarInput("medicalExpenses", e.target.value)}
          placeholder="$0"
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
        <label className="form-label">Description of Case*</label>
        <Textarea
          value={formData.caseDescription}
          onChange={(e) => handleInputChange("caseDescription", e.target.value)}
          placeholder="Please provide details about the case. This description will be publicly displayed on the settlement page."
        />
        {errors.caseDescription && (
          <p className="text-red-500 text-sm mt-1">{errors.caseDescription}</p>
        )}
      </div>
    </div>
  );
};

// Helper function to convert from ISO to display format
const getDisplayDate = (isoDate: string) => {
  if (!isoDate) return '';
  
  // If already in MM/DD/YYYY format, return as is
  if (isoDate.includes('/')) return isoDate;
  
  // If in YYYY-MM-DD format, convert to MM/DD/YYYY
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [_, year, month, day] = match;
    return `${month}/${day}/${year}`;
  }
  
  return isoDate;
};
