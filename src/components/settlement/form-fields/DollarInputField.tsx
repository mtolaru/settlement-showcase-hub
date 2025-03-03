
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

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
  
  // Handle numeric input only
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Only allow numbers, commas, and decimal points
    const filtered = inputValue.replace(/[^0-9,.]/g, '');
    onChange(filtered);
  };
  
  // Debug log when error changes
  useEffect(() => {
    if (error) {
      console.log(`DollarInputField "${label}" has error:`, error);
    }
  }, [error, label]);
  
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="form-label">
        {label}
      </Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span className="text-gray-500">$</span>
        </div>
        <Input
          id={fieldId}
          type="text"
          value={value}
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
