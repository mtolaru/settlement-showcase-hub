
import { Input } from "@/components/ui/input";

interface DollarInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  error?: string;
}

export const DollarInputField = ({
  label,
  value,
  onChange,
  placeholder = "$0",
  description,
  error,
}: DollarInputFieldProps) => {
  const formatDollarInput = (value: string) => {
    // Remove dollar sign and commas
    let numericValue = value.replace(/[$,]/g, '');
    
    // If empty, return empty string
    if (!numericValue) return '';
    
    // Format with dollar sign and commas
    return `$${numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handleDollarInput = (inputValue: string) => {
    // Remove dollar sign for processing
    const processedValue = inputValue.replace(/[$,]/g, '');
    onChange(processedValue);
  };

  return (
    <div>
      <label className="form-label">{label}</label>
      <Input
        type="text"
        value={formatDollarInput(value)}
        onChange={(e) => handleDollarInput(e.target.value)}
        placeholder={placeholder}
        className="no-spinner"
      />
      {description && (
        <p className="text-sm text-neutral-500 mt-1">{description}</p>
      )}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};
