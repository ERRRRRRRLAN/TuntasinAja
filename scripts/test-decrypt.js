require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { decryptPassword, encryptPassword } = require('../lib/password-encryption')

const prisma = new PrismaClient()

async function testDecrypt() {
  console.log('🧪 Testing password encryption/decryption...\n')
  
  // Check encryption key
  if (!process.env.PASSWORD_ENCRYPTION_KEY || process.env.PASSWORD_ENCRYPTION_KEY === 'default-key-change-in-production-32-chars!!') {
    console.error('❌ ERROR: PASSWORD_ENCRYPTION_KEY not set!')
    process.exit(1)
  }
  
  console.log('✅ Encryption key found:', process.env.PASSWORD_ENCRYPTION_KEY.substring(0, 20) + '...')
  
  // Test encrypt/decrypt with known password
  const testPassword = 'test123'
  console.log('\n📝 Test 1: Encrypt/Decrypt known password')
  console.log('  Original password:', testPassword)
  
  try {
    const encrypted = encryptPassword(testPassword)
    console.log('  Encrypted:', encrypted.substring(0, 50) + '...')
    
    const decrypted = decryptPassword(encrypted)
    console.log('  Decrypted:', decrypted)
    
    if (decrypted === testPassword) {
      console.log('  ✅ Test 1 PASSED\n')
    } else {
      console.log('  ❌ Test 1 FAILED: Password mismatch!')
      process.exit(1)
    }
  } catch (error) {
    console.error('  ❌ Test 1 FAILED:', error.message)
    process.exit(1)
  }
  
  // Test decrypt from database
  console.log('📝 Test 2: Decrypt password from database')
  const users = await prisma.user.findMany({
    where: {
      passwordEncrypted: { not: null }
    },
    select: {
      id: true,
      email: true,
      name: true,
      passwordEncrypted: true,
    },
    take: 3,
  })
  
  console.log(`  Found ${users.length} users with encrypted passwords\n`)
  
  for (const user of users) {
    try {
      console.log(`  Testing user: ${user.name} (${user.email})`)
      console.log(`    Encrypted (first 50 chars): ${user.passwordEncrypted?.substring(0, 50)}...`)
      
      const decrypted = decryptPassword(user.passwordEncrypted)
      console.log(`    Decrypted password: ${decrypted}`)
      console.log(`    ✅ Success\n`)
    } catch (error) {
      console.error(`    ❌ Failed: ${error.message}`)
      console.error(`    Error details:`, error)
      console.log('')
    }
  }
  
  console.log('✅ All tests completed!')
}

testDecrypt()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

