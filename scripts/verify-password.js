const bcrypt = require('bcryptjs')
const { extractBcryptInfo } = require('./extract-bcrypt-salt')

/**
 * Verify password dengan hash bcrypt
 * @param {string} password - Plain text password
 * @param {string} hash - Bcrypt hash dari database
 * @returns {Promise<object>} Hasil verifikasi dengan detail
 */
async function verifyPassword(password, hash) {
  try {
    // Extract info dari hash
    const info = extractBcryptInfo(hash)

    // Method 1: Menggunakan bcrypt.compare (recommended)
    const isValid = await bcrypt.compare(password, hash)

    // Method 2: Hash password dengan salt yang sama untuk perbandingan
    let testHash = null
    let hashMatch = false
    try {
      // Note: bcrypt.hash dengan salt langsung tidak support, jadi kita hanya bisa compare
      // Tapi kita bisa extract salt untuk informasi
      testHash = await bcrypt.hash(password, info.cost)
      // Note: testHash akan berbeda karena salt berbeda, jadi kita tidak bisa compare langsung
      // Kita hanya bisa menggunakan bcrypt.compare yang sudah handle ini
    } catch (error) {
      // Ignore error, kita tetap bisa verify dengan bcrypt.compare
    }

    return {
      isValid,
      password,
      hash,
      info: {
        algorithm: info.algorithm,
        cost: info.cost,
        salt: info.salt,
        saltLength: info.saltLength,
      },
      message: isValid 
        ? '✅ Password VALID - Password cocok dengan hash!' 
        : '❌ Password INVALID - Password tidak cocok dengan hash!'
    }
  } catch (error) {
    return {
      isValid: false,
      password,
      hash,
      error: error.message,
      message: `❌ Error: ${error.message}`
    }
  }
}

// Main function untuk CLI
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log(`
🔐 Password Verifier

Usage:
  node scripts/verify-password.js <password> <hash>

Examples:
  # Verify password dengan hash
  node scripts/verify-password.js "TiaraSalsabila521" "$2a$10$h/nVG0HnhDVC7zrjmZavcu7LNrYyjvNrJ9Qf7jli1oid60WhN8WEW"

  # Atau menggunakan npm script
  npm run verify:password "TiaraSalsabila521" "$2a$10$h/nVG0HnhDVC7zrjmZavcu7LNrYyjvNrJ9Qf7jli1oid60WhN8WEW"

Options:
  <password>  Plain text password yang akan di-verify
  <hash>      Bcrypt hash dari database
    `)
    process.exit(0)
  }

  const password = args[0]
  const hash = args[1]

  try {
    console.log('\n🔐 Verifying password...\n')
    console.log('─'.repeat(80))

    const result = await verifyPassword(password, hash)

    console.log('Password:', password)
    console.log('Hash:', hash)
    console.log('\n' + '─'.repeat(80))

    if (result.error) {
      console.error('\n❌ Error:', result.error)
      process.exit(1)
    }

    console.log('\n📋 Hash Information:')
    console.log('─'.repeat(80))
    console.log(`Algorithm: ${result.info.algorithm}`)
    console.log(`Cost:      ${result.info.cost} (2^${result.info.cost} rounds)`)
    console.log(`Salt:      ${result.info.salt}`)
    console.log(`Salt Length: ${result.info.saltLength} characters`)

    console.log('\n🔍 Verification Result:')
    console.log('─'.repeat(80))
    console.log(result.message)

    if (result.isValid) {
      console.log('\n✅ Password verification successful!')
      console.log('   Password yang diberikan cocok dengan hash di database.')
    } else {
      console.log('\n❌ Password verification failed!')
      console.log('   Password yang diberikan TIDAK cocok dengan hash di database.')
      console.log('   Kemungkinan:')
      console.log('   - Password salah')
      console.log('   - Hash tidak sesuai dengan password ini')
    }

    console.log('\n' + '─'.repeat(80) + '\n')

    // Exit dengan code sesuai hasil
    process.exit(result.isValid ? 0 : 1)

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\nMake sure:')
    console.error('  1. Password dan hash diberikan dengan benar')
    console.error('  2. Hash adalah valid bcrypt hash format')
    console.error('  3. Tidak ada typo pada password atau hash\n')
    process.exit(1)
  }
}

// Run jika dijalankan langsung
if (require.main === module) {
  main().catch(console.error)
}

// Export untuk digunakan sebagai module
module.exports = {
  verifyPassword,
}



