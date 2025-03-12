
/**
 * Formats a number to a US dollar string (e.g., "$1,234.56")
 */
export const formatNumber = (value: number | string): string => {
  if (!value && value !== 0) return '';
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if it's a valid number
  if (isNaN(numValue)) return '';
  
  // Format the number with commas and two decimal places
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
};

/**
 * Converts a formatted currency string back to a number
 */
export const unformatNumber = (value: string): string => {
  if (!value) return '';
  
  // Remove currency symbol, commas and other non-numeric characters except decimal point
  return value.replace(/[^0-9.]/g, '');
};
