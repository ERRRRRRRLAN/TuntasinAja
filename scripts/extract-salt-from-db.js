require('dotenv').config({ path: '.env' })
const { PrismaClient } = require('@prisma/client')
const { extractBcryptInfo } = require('./extract-bcrypt-salt')

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.log(`
🔍 Extract Salt from Database

Usage:
  node scripts/extract-salt-from-db.js <email>

Examples:
  # Extract salt untuk admin
  node scripts/extract-salt-from-db.js admin@tuntasinaja.com

  # Extract salt untuk user lain
  node scripts/extract-salt-from-db.js user@example.com

Options:
  <email>  Email user yang akan di-extract salt-nya
    `)
    process.exit(0)
  }

  console.log(`\n🔍 Extracting salt for user: ${email}\n`)

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    })

    if (!user) {
      console.error(`❌ User not found: ${email}`)
      process.exit(1)
    }

    if (!user.passwordHash) {
      console.error(`❌ User has no password hash: ${email}`)
      process.exit(1)
    }

    const info = extractBcryptInfo(user.passwordHash)

    console.log('User Information:')
    console.log('─'.repeat(80))
    console.log(`Name:  ${user.name}`)
    console.log(`Email: ${user.email}`)
    console.log(`ID:    ${user.id}`)

    console.log('\nHash Information:')
    console.log('─'.repeat(80))
    console.log(`Algorithm Version: ${info.algorithm}`)
    console.log(`Cost Factor:      ${info.cost} (2^${info.cost} rounds)`)
    console.log(`Salt:             ${info.salt}`)
    console.log(`Salt Length:      ${info.saltLength} characters`)
    console.log(`Hash Result:      ${info.hashResult}`)
    console.log(`Hash Length:      ${info.hashResultLength} characters`)
    console.log(`Total Length:     ${info.totalLength} characters`)

    console.log('\n📊 Visual Breakdown:')
    console.log('─'.repeat(80))
    console.log(`$2a$10$${info.salt}${info.hashResult}`)
    console.log('│  │  │ │')
    console.log('│  │  │ └─ Salt (22 chars)')
    console.log('│  │  └─ Hash Result (31 chars)')
    console.log('│  └─ Cost Factor')
    console.log('└─ Algorithm Version')

    console.log('\n' + '─'.repeat(80) + '\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.message.includes('Invalid bcrypt hash')) {
      console.error('\nThe password hash in database might be corrupted or invalid.')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)

