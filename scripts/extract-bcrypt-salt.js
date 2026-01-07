const bcrypt = require('bcryptjs')

/**
 * Extract salt dan informasi dari bcrypt hash
 * @param {string} hash - Bcrypt hash string
 * @returns {object} Informasi hash yang diekstrak
 */
function extractBcryptInfo(hash) {
  if (!hash || typeof hash !== 'string') {
    throw new Error('Hash must be a non-empty string')
  }

  // Validasi format hash bcrypt
  if (!hash.startsWith('$2')) {
    throw new Error('Invalid bcrypt hash format. Must start with $2a$, $2b$, or $2y$')
  }

  // Split hash berdasarkan delimiter $
  const parts = hash.split('$')
  
  if (parts.length < 4) {
    throw new Error('Invalid bcrypt hash format')
  }

  // Extract informasi
  const algorithm = parts[1]  // 2a, 2b, atau 2y
  const cost = parseInt(parts[2], 10)  // Cost factor (10, 12, dll)
  const saltAndHash = parts[3]  // Salt + hash combined

  // Salt adalah 22 karakter pertama dari saltAndHash
  const salt = saltAndHash.substring(0, 22)
  
  // Hash result adalah sisa karakter setelah salt
  const hashResult = saltAndHash.substring(22)

  return {
    fullHash: hash,
    algorithm: `$${algorithm}$`,
    cost: cost,
    salt: salt,
    saltLength: salt.length,
    hashResult: hashResult,
    hashResultLength: hashResult.length,
    totalLength: hash.length,
  }
}

/**
 * Verify password menggunakan salt yang diekstrak
 * @param {string} password - Plain text password
 * @param {string} storedHash - Bcrypt hash dari database
 * @returns {Promise<boolean>} True jika password valid
 */
async function verifyPasswordWithExtractedSalt(password, storedHash) {
  try {
    const info = extractBcryptInfo(storedHash)
    
    // Hash password dengan salt yang sama
    const testHash = await bcrypt.hash(password, info.salt)
    
    // Bandingkan hash
    return testHash === storedHash
  } catch (error) {
    console.error('Error verifying password:', error.message)
    return false
  }
}

// Main function untuk CLI
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
🔍 Bcrypt Hash Salt Extractor

Usage:
  node scripts/extract-bcrypt-salt.js <hash> [password]

Examples:
  # Extract salt dari hash
  node scripts/extract-bcrypt-salt.js "$2a$10$YzgQ2nKcqIncM0b2ZjIU3.Bh02KZUbcltA2iRnHc9Sn6vxQTF4PQG"

  # Extract salt dan verify password
  node scripts/extract-bcrypt-salt.js "$2a$10$YzgQ2nKcqIncM0b2ZjIU3.Bh02KZUbcltA2iRnHc9Sn6vxQTF4PQG" "erlan2106"

Options:
  <hash>      Bcrypt hash string dari database
  [password]  (Optional) Password untuk di-verify dengan hash
    `)
    process.exit(0)
  }

  const hash = args[0]
  const password = args[1]

  try {
    console.log('\n📋 Extracting salt from bcrypt hash...\n')
    console.log('Hash:', hash)
    console.log('─'.repeat(80))

    // Extract informasi
    const info = extractBcryptInfo(hash)

    console.log('\n✅ Hash Information:')
    console.log('─'.repeat(80))
    console.log(`Algorithm Version: ${info.algorithm}`)
    console.log(`Cost Factor:      ${info.cost} (2^${info.cost} rounds)`)
    console.log(`Salt:             ${info.salt}`)
    console.log(`Salt Length:      ${info.saltLength} characters`)
    console.log(`Hash Result:      ${info.hashResult}`)
    console.log(`Hash Length:      ${info.hashResultLength} characters`)
    console.log(`Total Length:     ${info.totalLength} characters`)

    // Visual breakdown
    console.log('\n📊 Visual Breakdown:')
    console.log('─'.repeat(80))
    console.log(`$2a$10$${info.salt}${info.hashResult}`)
    console.log('│  │  │ │')
    console.log('│  │  │ └─ Salt (22 chars)')
    console.log('│  │  └─ Hash Result (31 chars)')
    console.log('│  └─ Cost Factor')
    console.log('└─ Algorithm Version')

    // Jika ada password, verify
    if (password) {
      console.log('\n🔐 Verifying password...')
      console.log('─'.repeat(80))
      console.log(`Password: "${password}"`)
      
      // Method 1: Menggunakan bcrypt.compare (recommended)
      const isValid1 = await bcrypt.compare(password, hash)
      console.log(`\n✅ bcrypt.compare(): ${isValid1 ? 'VALID ✓' : 'INVALID ✗'}`)

      // Method 2: Menggunakan extracted salt
      const isValid2 = await verifyPasswordWithExtractedSalt(password, hash)
      console.log(`✅ Extracted Salt:  ${isValid2 ? 'VALID ✓' : 'INVALID ✗'}`)

      if (isValid1 && isValid2) {
        console.log('\n🎉 Password verification successful!')
      } else {
        console.log('\n❌ Password verification failed!')
      }
    }

    console.log('\n' + '─'.repeat(80) + '\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\nMake sure the hash is a valid bcrypt hash format.')
    console.error('Example: $2a$10$YzgQ2nKcqIncM0b2ZjIU3.Bh02KZUbcltA2iRnHc9Sn6vxQTF4PQG\n')
    process.exit(1)
  }
}

// Run jika dijalankan langsung
if (require.main === module) {
  main().catch(console.error)
}

// Export untuk digunakan sebagai module
module.exports = {
  extractBcryptInfo,
  verifyPasswordWithExtractedSalt,
}

