
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  return (
    <div className="space-y-2">
      <Label htmlFor={label.replace(/\s+/g, '-').toLowerCase()} className="form-label">
        {label}
      </Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span className="text-gray-500">$</span>
        </div>
        <Input
          id={label.replace(/\s+/g, '-').toLowerCase()}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "pl-7",
            error ? 'border-red-500 focus-visible:ring-red-500' : ''
          )}
        />
      </div>
      {description && !error && (
        <p className="text-sm text-neutral-500 mt-1">{description}</p>
      )}
      {error && (
        <p className="text-sm font-medium text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};
