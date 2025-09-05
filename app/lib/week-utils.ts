/**
 * Utility functions for handling weekly date operations
 */

/**
 * Get the start of the week (Monday) for a given date
 * @param date - The date to get the week start for
 * @returns Date object representing the start of the week (Monday at 00:00:00)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

/**
 * Get the end of the week (Sunday) for a given date
 * @param date - The date to get the week end for
 * @returns Date object representing the end of the week (Sunday at 23:59:59.999)
 */
export function getWeekEnd(date: Date): Date {
  const startOfWeek = getWeekStart(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}

/**
 * Get both start and end of week for a given date
 * @param date - The date to get the week bounds for
 * @returns Object with startOfWeek and endOfWeek dates
 */
export function getWeekBounds(date: Date): {
  startOfWeek: Date;
  endOfWeek: Date;
} {
  const startOfWeek = getWeekStart(date);
  const endOfWeek = getWeekEnd(date);
  return { startOfWeek, endOfWeek };
}

/**
 * Format a week range for display (e.g., "Jan 1 - Jan 7, 2024")
 * @param startDate - The start date of the week (Monday)
 * @returns Formatted string representing the week range
 */
export function formatWeekDisplay(startDate: Date): string {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year:
      startDate.getFullYear() !== endDate.getFullYear() ? "numeric" : undefined,
  };

  const startStr = startDate.toLocaleDateString("en-US", options);
  const endStr = endDate.toLocaleDateString("en-US", options);

  // If it's the same year, only show year at the end
  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${startStr} - ${endStr}, ${endDate.getFullYear()}`;
  }

  return `${startStr} - ${endStr}`;
}

/**
 * Get the current week's Monday
 * @returns Date object representing this week's Monday
 */
export function getCurrentWeekStart(): Date {
  return getWeekStart(new Date());
}

/**
 * Check if two dates are in the same week
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if both dates are in the same week
 */
export function isSameWeek(date1: Date, date2: Date): boolean {
  const week1Start = getWeekStart(date1);
  const week2Start = getWeekStart(date2);
  return week1Start.getTime() === week2Start.getTime();
}

/**
 * Get the ISO week number for a date
 * @param date - The date to get the week number for
 * @returns Week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
