
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
  const isRequired = label.includes('*');
  const fieldId = label.replace(/\s+/g, '-').toLowerCase();
  
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="form-label">
        {label.replace('*', '')}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "resize-y min-h-[100px] w-full",
          error ? 'border-red-500 focus-visible:ring-red-500' : ''
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
      />
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
