
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error,
  required = false
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${label.toLowerCase().replace(/\s+/g, "-")}-select`}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          id={`${label.toLowerCase().replace(/\s+/g, "-")}-select`}
          className={error ? "border-red-500" : ""}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
