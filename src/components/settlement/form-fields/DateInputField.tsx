
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DateInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  error?: string;
  required?: boolean;
}

export const DateInputField: React.FC<DateInputFieldProps> = ({
  label,
  value,
  onChange,
  description,
  error,
  required = false
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${label.toLowerCase().replace(/\s+/g, "-")}-input`}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={`${label.toLowerCase().replace(/\s+/g, "-")}-input`}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-red-500" : ""}
      />
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};
