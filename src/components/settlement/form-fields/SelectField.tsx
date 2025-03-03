
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
  error?: string;
}

export const SelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  description,
  error,
}: SelectFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={label.replace(/\s+/g, '-').toLowerCase()} className="form-label">
        {label}
      </Label>
      <select
        id={label.replace(/\s+/g, '-').toLowerCase()}
        className={cn(
          "form-input w-full rounded-md border px-3 py-2 text-sm",
          error ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200'
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description && !error && (
        <p className="text-sm text-neutral-500 mt-1">{description}</p>
      )}
      {error && (
        <p className="text-sm font-medium text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};
