
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  placeholder,
  description,
  error,
}: DollarInputFieldProps) => {
  const isRequired = label.includes('*');
  const fieldId = label.replace(/\s+/g, '-').toLowerCase();
  const [displayValue, setDisplayValue] = useState(value);
  
  // Format value with commas when component mounts or value changes
  useEffect(() => {
    if (value) {
      // If it's already formatted, don't reformat
      if (!isNaN(parseFloat(value.replace(/,/g, '')))) {
        const formattedValue = formatNumberWithCommas(value);
        setDisplayValue(formattedValue);
      } else {
        setDisplayValue(value);
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);
  
  // Format number with commas for thousands
  const formatNumberWithCommas = (num: string): string => {
    // Remove any existing commas
    const plainNumber = num.replace(/,/g, '');
    
    // Check if there's a decimal point
    if (plainNumber.includes('.')) {
      const parts = plainNumber.split('.');
      // Format the whole number part with commas
      return parts[0] ? Number(parts[0]).toLocaleString() + '.' + parts[1] : '' + '.' + parts[1];
    }
    
    // Format the number with commas
    return plainNumber ? Number(plainNumber).toLocaleString() : '';
  };
  
  // Handle numeric input and maintain formatting
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Only allow numbers, commas, and decimal points
    const filtered = inputValue.replace(/[^0-9,.]/g, '');
    
    // Update the display value
    setDisplayValue(filtered);
    
    // Send the filtered value to parent component
    onChange(filtered);
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="form-label">
        {label.replace('*', '')}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span className="text-gray-500">$</span>
        </div>
        <Input
          id={fieldId}
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "pl-7 w-full",
            error ? 'border-red-500 focus-visible:ring-red-500' : ''
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
        />
      </div>
      {description && !error && (
        <p className="text-sm text-neutral-500 mt-1">{description}</p>
      )}
      {error && (
        <p 
          id={`${fieldId}-error`}
          className="text-sm font-medium text-red-500 mt-1"
        >
          {error}
        </p>
      )}
    </div>
  );
};
