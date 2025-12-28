import crypto from 'crypto'

/**
 * Encryption key untuk password encryption
 * Key ini harus disimpan di environment variable untuk keamanan
 */
const ENCRYPTION_KEY = process.env.PASSWORD_ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!'
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 16 bytes untuk AES
const SALT_LENGTH = 64 // 64 bytes untuk salt
const TAG_LENGTH = 16 // 16 bytes untuk GCM auth tag

/**
 * Encrypt password menggunakan AES-256-GCM
 * @param password - Password plaintext yang akan di-encrypt
 * @returns Encrypted password dalam format: salt:iv:tag:encrypted
 */
export function encryptPassword(password: string): string {
  if (!password) {
    throw new Error('Password cannot be empty')
  }

  // Generate random salt
  const salt = crypto.randomBytes(SALT_LENGTH)
  
  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH)
  
  // Derive key from encryption key and salt using PBKDF2
  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha256')
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  // Encrypt password
  let encrypted = cipher.update(password, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Get auth tag
  const tag = cipher.getAuthTag()
  
  // Combine salt:iv:tag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt password menggunakan AES-256-GCM
 * @param encryptedPassword - Encrypted password dalam format: salt:iv:tag:encrypted
 * @returns Password plaintext
 */
export function decryptPassword(encryptedPassword: string): string {
  if (!encryptedPassword) {
    throw new Error('Encrypted password cannot be empty')
  }

  try {
    // Split encrypted password
    const parts = encryptedPassword.split(':')
    
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted password format')
    }
    
    const [saltHex, ivHex, tagHex, encrypted] = parts
    
    // Convert hex to buffers
    const salt = Buffer.from(saltHex, 'hex')
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    
    // Derive key from encryption key and salt using PBKDF2
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha256')
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    // Decrypt password
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    throw new Error(`Failed to decrypt password: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Verify jika encrypted password valid
 * @param encryptedPassword - Encrypted password yang akan di-verify
 * @returns true jika valid, false jika tidak
 */
export function isValidEncryptedPassword(encryptedPassword: string): boolean {
  if (!encryptedPassword) {
    return false
  }
  
  try {
    const parts = encryptedPassword.split(':')
    return parts.length === 4
  } catch {
    return false
  }
}

