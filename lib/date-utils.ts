/**
 * Utility functions for handling dates with correct timezone
 * Ensures all dates are handled consistently with Asia/Jakarta timezone
 */

/**
 * Get current date in Asia/Jakarta timezone
 * Returns a Date object representing the current time in Asia/Jakarta
 */
export function getJakartaDate(): Date {
  const now = new Date()
  // Get timezone offset for Asia/Jakarta (UTC+7)
  const jakartaOffset = 7 * 60 // 7 hours in minutes
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
  const jakartaTime = new Date(utcTime + (jakartaOffset * 60000))
  return jakartaTime
}

/**
 * Get today's date at midnight in Asia/Jakarta timezone
 * Useful for date comparisons and filtering
 */
export function getJakartaToday(): Date {
  const jakartaDate = getJakartaDate()
  jakartaDate.setHours(0, 0, 0, 0)
  return jakartaDate
}

/**
 * Convert a Date object to Asia/Jakarta timezone
 */
export function toJakartaTime(date: Date): Date {
  const jakartaOffset = 7 * 60 // 7 hours in minutes
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000)
  const jakartaTime = new Date(utcTime + (jakartaOffset * 60000))
  return jakartaTime
}

/**
 * Get current timestamp in UTC (for database storage)
 * PostgreSQL stores timestamps in UTC, so we need to ensure we're sending UTC
 * JavaScript Date objects are already in UTC internally, but this function
 * ensures we're explicitly working with UTC
 */
export function getUTCDate(): Date {
  // JavaScript Date is already in UTC internally
  // But we return it explicitly to make the intent clear
  return new Date()
}

/**
 * Get today at midnight in UTC
 * This ensures consistency when storing dates in the database
 */
export function getUTCToday(): Date {
  const now = new Date()
  // Get UTC date
  const utcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ))
  return utcDate
}

/**
 * Get today at midnight in Asia/Jakarta, then convert to UTC for database
 * This ensures the date represents "today" in Jakarta timezone
 */
export function getJakartaTodayAsUTC(): Date {
  const jakartaToday = getJakartaToday()
  // Convert Jakarta time to UTC for database storage
  // Jakarta is UTC+7, so we subtract 7 hours
  const utcTime = new Date(jakartaToday.getTime() - (7 * 60 * 60 * 1000))
  return utcTime
}

