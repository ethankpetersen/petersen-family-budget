/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateToLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current date as YYYY-MM-DD
 */
export function getCurrentDateString(): string {
  return formatDateToLocalString(new Date());
}

/**
 * Add days to a date string YYYY-MM-DD
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone shift
  d.setDate(d.getDate() + days);
  return formatDateToLocalString(d);
}

/**
 * Add months to a date string YYYY-MM-DD, snapping to valid days
 */
export function addMonths(dateStr: string, months: number, targetDayOfMonth?: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  const currentDay = targetDayOfMonth || d.getDate();
  
  d.setMonth(d.getMonth() + months);
  
  // Handle end of month snapping (e.g. Jan 31 + 1 month -> Feb 28)
  const daysInNewMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(currentDay, daysInNewMonth));
  
  return formatDateToLocalString(d);
}
