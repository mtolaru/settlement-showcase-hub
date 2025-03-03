
import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  required?: boolean;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  error,
  maxLength,
  required = false
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${label.toLowerCase().replace(/\s+/g, "-")}-textarea`}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id={`${label.toLowerCase().replace(/\s+/g, "-")}-textarea`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={error ? "border-red-500" : ""}
        maxLength={maxLength}
      />
      {maxLength && (
        <div className="text-xs text-gray-500 text-right">
          {value.length}/{maxLength}
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
