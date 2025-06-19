
/**
 * Utility functions for handling Brazil timezone (UTC-3)
 */

// Brazil timezone offset (UTC-3)
const BRAZIL_OFFSET_HOURS = -3;

/**
 * Convert a date to Brazil timezone
 */
export const toBrazilTime = (date: Date): Date => {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (BRAZIL_OFFSET_HOURS * 3600000));
};

/**
 * Convert a date from Brazil timezone to UTC
 */
export const fromBrazilTime = (date: Date): Date => {
  const utc = date.getTime() - (BRAZIL_OFFSET_HOURS * 3600000);
  return new Date(utc - (date.getTimezoneOffset() * 60000));
};

/**
 * Format date for datetime-local input in Brazil timezone
 */
export const formatDateTimeLocal = (dateString: string | null): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const brazilDate = toBrazilTime(date);
    
    // Format as YYYY-MM-DDTHH:mm
    const year = brazilDate.getFullYear();
    const month = String(brazilDate.getMonth() + 1).padStart(2, '0');
    const day = String(brazilDate.getDate()).padStart(2, '0');
    const hours = String(brazilDate.getHours()).padStart(2, '0');
    const minutes = String(brazilDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('[brazilTimezone] Error formatting date:', error);
    return '';
  }
};

/**
 * Parse datetime-local input as Brazil timezone
 */
export const parseDateTimeLocal = (dateTimeLocal: string): string => {
  if (!dateTimeLocal) return '';
  
  try {
    // Create date assuming it's in Brazil timezone
    const localDate = new Date(dateTimeLocal);
    const utcDate = fromBrazilTime(localDate);
    
    return utcDate.toISOString();
  } catch (error) {
    console.error('[brazilTimezone] Error parsing date:', error);
    return '';
  }
};

/**
 * Get current Brazil time
 */
export const getBrazilNow = (): Date => {
  return toBrazilTime(new Date());
};

/**
 * Check if a date is in the future considering Brazil timezone
 */
export const isFutureBrazilTime = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const now = getBrazilNow();
    return date.getTime() > now.getTime();
  } catch (error) {
    return false;
  }
};

/**
 * Check if a date is in the past considering Brazil timezone
 */
export const isPastBrazilTime = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const now = getBrazilNow();
    return date.getTime() < now.getTime();
  } catch (error) {
    return false;
  }
};
