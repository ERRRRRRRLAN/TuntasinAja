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
 * Get current timestamp in Asia/Jakarta timezone (for database storage)
 * 
 * This function returns a Date object representing the current time in Jakarta (UTC+7).
 * The Date object stores time internally as UTC, so we need to ensure it represents
 * the correct Jakarta time when stored in the database.
 * 
 * Strategy:
 * 1. Get current UTC time
 * 2. Since we want Jakarta time (UTC+7), we create a Date that represents
 *    the current Jakarta time. When this is stored in a database with timezone
 *    set to Asia/Jakarta, it will display correctly.
 * 
 * IMPORTANT: Ensure your database timezone is set to 'Asia/Jakarta' in DATABASE_URL:
 * ?options=-c%20timezone%3DAsia/Jakarta
 */
export function getUTCDate(): Date {
  // Get current time (UTC internally)
  const now = new Date()
  
  // Get Jakarta time components using Intl API
  const jakartaParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now)
  
  // Extract components
  const year = parseInt(jakartaParts.find(p => p.type === 'year')?.value || '0')
  const month = parseInt(jakartaParts.find(p => p.type === 'month')?.value || '0') - 1
  const day = parseInt(jakartaParts.find(p => p.type === 'day')?.value || '0')
  const hour = parseInt(jakartaParts.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(jakartaParts.find(p => p.type === 'minute')?.value || '0')
  const second = parseInt(jakartaParts.find(p => p.type === 'second')?.value || '0')
  
  // Create Date object using UTC constructor with Jakarta time values
  // This creates a Date that represents Jakarta time as if it were UTC
  // When stored in database with timezone Asia/Jakarta, PostgreSQL will interpret
  // this correctly and display it as Jakarta time
  return new Date(Date.UTC(year, month, day, hour, minute, second))
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

