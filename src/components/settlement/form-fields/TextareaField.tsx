
import { Textarea } from "@/components/ui/textarea";

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
    <div>
      <label className="form-label">{label}</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="resize-y min-h-[100px]"
      />
      {description && (
        <p className="text-sm text-neutral-500 mt-1">{description}</p>
      )}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};
