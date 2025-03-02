import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface DateInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  error?: string;
}

export const DateInputField = ({
  label,
  value,
  onChange,
  placeholder = "MM/DD/YYYY",
  description,
  error,
}: DateInputFieldProps) => {
  const [focused, setFocused] = useState<boolean>(false);
  const [displayDate, setDisplayDate] = useState<string>("");

  const formatDateInput = (value: string) => {
    // Remove any non-digits
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
  };
  
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Format the date for display
    const formatted = formatDateInput(value);
    setDisplayDate(formatted);
    
    // Convert MM/DD/YYYY to YYYY-MM-DD for storage if complete
    const digits = value.replace(/\D/g, '');
    if (digits.length === 8) {
      const month = digits.slice(0, 2);
      const day = digits.slice(2, 4);
      const year = digits.slice(4, 8);
      const isoDate = `${year}-${month}-${day}`;
      onChange(isoDate);
    } else {
      // Just keep the formatted value if not complete
      onChange(formatted);
    }
  };
  
  const handleDateFocus = () => {
    setFocused(true);
    // If we have an ISO date, convert to MM/DD/YYYY for display
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = value.split('-');
      setDisplayDate(`${month}/${day}/${year}`);
    } else if (value.includes('/')) {
      setDisplayDate(value);
    } else {
      setDisplayDate("");
    }
  };
  
  const handleDateBlur = () => {
    setFocused(false);
    
    // If we have a full date in MM/DD/YYYY format, convert to YYYY-MM-DD
    const match = displayDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const [_, month, day, year] = match;
      const isoDate = `${year}-${month}-${day}`;
      onChange(isoDate);
    }
  };

  useEffect(() => {
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = value.split('-');
      setDisplayDate(`${month}/${day}/${year}`);
    } else if (value.includes('/')) {
      setDisplayDate(value);
    }
  }, [value]);

  // Helper function to convert from ISO to display format
  const getDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    
    // If already in MM/DD/YYYY format, return as is
    if (isoDate.includes('/')) return isoDate;
    
    // If in YYYY-MM-DD format, convert to MM/DD/YYYY
    const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [_, year, month, day] = match;
      return `${month}/${day}/${year}`;
    }
    
    return isoDate;
  };

  return (
    <div>
      <label className="form-label">{label}</label>
      <Input
        type="text"
        value={focused ? displayDate : (displayDate || getDisplayDate(value))}
        onChange={handleDateInput}
        onFocus={handleDateFocus}
        onBlur={handleDateBlur}
        placeholder={placeholder}
        className="no-spinner"
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
