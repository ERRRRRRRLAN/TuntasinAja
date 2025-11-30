const bcrypt = require('bcryptjs')

async function generateHash() {
  const password = '210609190210'
  const hash = await bcrypt.hash(password, 10)
  console.log('\n========================================')
  console.log('🔐 ADMIN PASSWORD HASH GENERATOR')
  console.log('========================================\n')
  console.log('Password:', password)
  console.log('Hash:', hash)
  console.log('\n========================================\n')
  return hash
}

generateHash()

