
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DollarInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const DollarInputField: React.FC<DollarInputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  description,
  error,
  required = false
}) => {
  const [displayValue, setDisplayValue] = useState(value ? formatNumberWithCommas(value) : "");

  // When the parent component updates the value, update the display value
  useEffect(() => {
    if (value) {
      // Format value with commas regardless of current formatting
      if (!isNaN(parseFloat(value.replace(/,/g, '')))) {
        const formattedValue = formatNumberWithCommas(value);
        setDisplayValue(formattedValue);
      } else {
        setDisplayValue(value);
      }
    } else {
      setDisplayValue("");
    }
  }, [value]);

  // Convert a number string to a formatted string with commas
  const formatNumberWithCommas = (value: string): string => {
    // Remove existing commas and any non-numeric characters except decimal points
    const plainNumber = value.replace(/,/g, '').replace(/[^\d.]/g, '');
    
    // Handle numbers with decimal points
    if (plainNumber.includes('.')) {
      const parts = plainNumber.split('.');
      // Format the whole number part with commas
      const formattedWhole = parts[0] ? Number(parts[0]).toLocaleString() : '';
      return formattedWhole + '.' + parts[1];
    }
    
    // Format the number with commas
    return plainNumber ? Number(plainNumber).toLocaleString() : '';
  };
  
  // Handle numeric input and maintain formatting
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Remove dollar signs if present
    const withoutDollarSign = rawValue.replace('$', '');
    
    // Set the display value to what the user typed
    setDisplayValue(withoutDollarSign);
    
    // Remove commas for the actual value stored
    const filtered = withoutDollarSign.replace(/,/g, '');
    
    // Send the filtered value to parent component
    onChange(filtered);
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor={`${label}-input`}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span className="text-gray-500">$</span>
        </div>
        <Input
          id={`${label}-input`}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`pl-7 ${error ? "border-red-500" : ""}`}
        />
      </div>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};
