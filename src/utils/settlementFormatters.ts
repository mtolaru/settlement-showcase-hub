
/**
 * Formats a number as a currency value
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

/**
 * Formats a date string into a readable format
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  } catch (e) {
    return "N/A";
  }
};

/**
 * Gets a display label for a settlement phase
 * @param phase - The phase value from the database
 * @returns Formatted phase label
 */
export const getSettlementPhaseLabel = (phase: string | null): string => {
  if (!phase) return "";
  
  switch (phase) {
    case 'pre-litigation':
      return 'Pre-Litigation';
    case 'during-litigation':
      return 'During Litigation';
    case 'post-trial':
      return 'Post-Trial';
    default:
      return phase.charAt(0).toUpperCase() + phase.slice(1);
  }
};
