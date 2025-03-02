
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
    <div>
      <label className="form-label">{label}</label>
      <select
        className="form-input w-full rounded-md border border-neutral-200 p-2"
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
      {description && (
        <p className="text-sm text-neutral-500 mt-1">{description}</p>
      )}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};
