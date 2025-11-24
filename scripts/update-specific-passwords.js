const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Password yang perlu diupdate
const passwordUpdates = [
  { email: 'bilal@tuntasinaja.com', password: 'bilal10' },
  { email: 'yudha@tuntasinaja.com', password: 'yudha321' },
  { email: 'hafizh@tuntasinaja.com', password: 'hafizh999' },
]

async function main() {
  console.log('🚀 Updating specific passwords...\n')

  let successCount = 0
  let errorCount = 0

  for (const { email, password } of passwordUpdates) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        console.log(`⚠️  User not found: ${email}`)
        errorCount++
        continue
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10)

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
        },
      })

      console.log(`✅ Updated: ${user.name}`)
      console.log(`   Email: ${email}`)
      console.log(`   Password: ${password}\n`)

      successCount++
    } catch (error) {
      console.error(`❌ Error updating password for ${email}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



