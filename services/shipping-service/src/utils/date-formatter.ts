/**
 * Format a Date object for JSON serialization
 * @param date Date object to format
 * @returns ISO formatted date string or null if the date is invalid
 */
export function formatDateForJson(date: Date | null | undefined): string | null {
  if (!date) return null;
  
  // Check if the date is valid before formatting
  if (isNaN(date.getTime())) return null;
  
  return date.toISOString();
}

/**
 * Format a TypeORM column that might contain a date
 * @param dateValue Value that might be a Date object
 * @returns ISO formatted date string or the original value
 */
export function formatDateColumn(dateValue: any): string | any {
  if (dateValue instanceof Date) {
    return formatDateForJson(dateValue);
  }
  return dateValue;
} 