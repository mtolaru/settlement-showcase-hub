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
    
    // Only if we have a complete date, convert to ISO format
    if (formatted.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [month, day, year] = formatted.split('/');
      
      // Make sure we have valid date components
      if (
        Number(month) >= 1 && Number(month) <= 12 &&
        Number(day) >= 1 && Number(day) <= 31 &&
        Number(year) >= 1900
      ) {
        const isoDate = `${year}-${month}-${day}`;
        onChange(isoDate);
      } else {
        // Keep the formatted value if components are invalid
        onChange(formatted);
      }
    } else {
      // Keep the formatted value if incomplete
      onChange(formatted);
    }
  };
  
  const handleDateFocus = () => {
    setFocused(true);
    
    // Format the date for editing
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
      
      // Check if date parts are valid
      if (
        Number(month) >= 1 && Number(month) <= 12 &&
        Number(day) >= 1 && Number(day) <= 31 &&
        Number(year) >= 1900
      ) {
        const isoDate = `${year}-${month}-${day}`;
        onChange(isoDate);
      }
    }
  };

  // Initialize the display date from the provided value
  useEffect(() => {
    if (!focused) {
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = value.split('-');
        setDisplayDate(`${month}/${day}/${year}`);
      } else if (value.includes('/')) {
        setDisplayDate(value);
      } else if (value) {
        // Handle any other format or clear if not a recognizable format
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            setDisplayDate(`${month}/${day}/${year}`);
          } else {
            setDisplayDate(value);
          }
        } catch (e) {
          setDisplayDate(value);
        }
      }
    }
  }, [value, focused]);

  return (
    <div>
      <label className="form-label">{label}</label>
      <Input
        type="text"
        value={displayDate}
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
