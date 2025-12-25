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
  .email('Format email tidak valid')
  .refine((val) => emailRegex.test(val), {
    message: 'Format email tidak valid',
  })
  .max(255, 'Email terlalu panjang (maksimal 255 karakter)')

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
 * - Min 8 characters
 * - Must contain at least one uppercase letter
 * - Must contain at least one lowercase letter
 * - Must contain at least one number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password harus minimal 8 karakter')
  .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
  .regex(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
  .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka')
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

