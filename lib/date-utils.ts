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
 * 
 * This function returns the current UTC time. Since PostgreSQL stores timestamps in UTC,
 * we should store the actual UTC time. The database timezone setting will handle
 * conversion when querying.
 * 
 * IMPORTANT: Ensure your database timezone is set to 'Asia/Jakarta' in DATABASE_URL:
 * ?options=-c%20timezone%3DAsia/Jakarta
 * 
 * This ensures that when you query timestamps, PostgreSQL will automatically
 * convert them to Jakarta timezone for display.
 */
export function getUTCDate(): Date {
  // Simply return current UTC time
  // PostgreSQL will handle timezone conversion based on database timezone setting
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
  const now = new Date()
  
  // Get current time in Jakarta timezone
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
  
  // Extract Jakarta date components
  const year = parseInt(jakartaParts.find(p => p.type === 'year')?.value || '0')
  const month = parseInt(jakartaParts.find(p => p.type === 'month')?.value || '0') - 1
  const day = parseInt(jakartaParts.find(p => p.type === 'day')?.value || '0')
  
  // Create midnight in Jakarta timezone
  // Then convert to UTC by subtracting 7 hours (Jakarta is UTC+7)
  const jakartaMidnight = new Date(Date.UTC(year, month, day, 0, 0, 0))
  const utcMidnight = new Date(jakartaMidnight.getTime() - (7 * 60 * 60 * 1000))
  
  return utcMidnight
}

/**
 * Convert a date from database (UTC) to Jakarta time for display
 * 
 * Prisma returns Date objects that represent UTC time from the database.
 * This function creates a Date object with Jakarta time components that
 * can be formatted correctly using date-fns format().
 * 
 * Strategy: Use Intl API to get Jakarta time components from the UTC date,
 * then create a new Date object with those components. This ensures the
 * Date object represents Jakarta time when formatted.
 */
export function toJakartaDate(date: string | Date): Date {
  // Parse the date if it's a string
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
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
  }).formatToParts(dateObj)
  
  // Extract components
  const year = parseInt(jakartaParts.find(p => p.type === 'year')?.value || '0')
  const month = parseInt(jakartaParts.find(p => p.type === 'month')?.value || '0') - 1
  const day = parseInt(jakartaParts.find(p => p.type === 'day')?.value || '0')
  const hour = parseInt(jakartaParts.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(jakartaParts.find(p => p.type === 'minute')?.value || '0')
  const second = parseInt(jakartaParts.find(p => p.type === 'second')?.value || '0')
  
  // Create a Date object with Jakarta time components
  // This Date object will represent Jakarta time when formatted
  return new Date(year, month, day, hour, minute, second)
}

/**
 * Format a date for display in Jakarta timezone
 * This is a helper that ensures dates are displayed correctly in Jakarta time
 */
export function formatJakartaDate(date: string | Date, formatStr: string = 'EEEE, d MMM yyyy, HH:mm'): string {
  const dateObj = toJakartaDate(date)
  
  // Use toLocaleString to get Jakarta time components
  const jakartaString = dateObj.toLocaleString('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Parse and format using date-fns format
  // For now, return the formatted string directly
  // In a real implementation, you'd use date-fns-tz
  return jakartaString
}

