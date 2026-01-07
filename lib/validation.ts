import { z } from 'zod'

/**
 * Email validation regex - RFC 5322 compliant (simplified)
 * Validates common email formats
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Enhanced email validation schema
 * - Validates email format with regex
 * - Trims whitespace
 * - Converts to lowercase
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email tidak boleh kosong')
  .max(255, 'Email terlalu panjang (maksimal 255 karakter)')
  .email('Format email tidak valid')
  .refine((val) => emailRegex.test(val), {
    message: 'Format email tidak valid',
  })

/**
 * Name validation schema
 * - Trims whitespace
 * - Min 3 characters
 * - Max 100 characters
 */
export const nameSchema = z
  .string()
  .trim()
  .min(3, 'Nama harus minimal 3 karakter')
  .max(100, 'Nama terlalu panjang (maksimal 100 karakter)')

/**
 * Thread title validation schema
 * - Trims whitespace
 * - Min 1 character
 * - Max 200 characters
 */
export const threadTitleSchema = z
  .string()
  .trim()
  .min(1, 'Judul tidak boleh kosong')
  .max(200, 'Judul terlalu panjang (maksimal 200 karakter)')

/**
 * Comment content validation schema
 * - Trims whitespace
 * - Min 1 character
 * - Max 5000 characters
 */
export const commentContentSchema = z
  .string()
  .trim()
  .min(1, 'Konten tidak boleh kosong')
  .max(5000, 'Konten terlalu panjang (maksimal 5000 karakter)')

/**
 * Group task title validation schema
 * - Trims whitespace
 * - Max 200 characters
 * - Optional
 */
export const groupTaskTitleSchema = z
  .string()
  .trim()
  .max(200, 'Judul tugas kelompok terlalu panjang (maksimal 200 karakter)')
  .optional()

/**
 * Password validation schema
 * - Min 1 character (flexible, no strict requirements)
 * - Max 128 characters
 * - No regex validation - user can use any password format they want
 * - Trims whitespace
 */
export const passwordSchema = z
  .string()
  .trim()
  .min(1, 'Password tidak boleh kosong')
  .max(128, 'Password terlalu panjang (maksimal 128 karakter)')

/**
 * Helper function to create a trimmed string schema
 * Useful for custom string validations
 */
export function createTrimmedStringSchema(
  min: number,
  max: number,
  errorMessages?: {
    min?: string
    max?: string
    empty?: string
  }
) {
  return z
    .string()
    .trim()
    .min(min, errorMessages?.min || `Minimal ${min} karakter`)
    .max(max, errorMessages?.max || `Maksimal ${max} karakter`)
}

