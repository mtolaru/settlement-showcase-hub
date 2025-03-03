
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  rows?: number;
}

export const TextareaField = ({
  label,
  value,
  onChange,
  placeholder,
  description,
  error,
  rows = 4
}: TextareaFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={label.replace(/\s+/g, '-').toLowerCase()} className="form-label">
        {label}
      </Label>
      <Textarea
        id={label.replace(/\s+/g, '-').toLowerCase()}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "resize-y min-h-[100px]",
          error ? 'border-red-500 focus-visible:ring-red-500' : ''
        )}
      />
      {description && !error && (
        <p className="text-sm text-neutral-500 mt-1">{description}</p>
      )}
      {error && (
        <p className="text-sm font-medium text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};
