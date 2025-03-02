
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
    // First remove any non-numeric characters (except decimal point)
    const sanitizedValue = inputValue.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = sanitizedValue.split('.');
    const processedValue = parts.length > 2 
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : sanitizedValue;
    
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
        inputMode="decimal"
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
