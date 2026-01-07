import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script untuk menormalisasi email semua user di database
 * Email akan di-trim dan di-convert ke lowercase
 */
async function normalizeEmails() {
  console.log('🚀 Starting email normalization...\n')

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    console.log(`📋 Found ${users.length} users\n`)

    let updatedCount = 0
    let skippedCount = 0

    for (const user of users) {
      const normalizedEmail = user.email.trim().toLowerCase()

      // Skip if email is already normalized
      if (user.email === normalizedEmail) {
        skippedCount++
        continue
      }

      // Check if normalized email already exists (duplicate)
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })

      if (existingUser && existingUser.id !== user.id) {
        console.log(
          `⚠️  Skipping ${user.name} (${user.email}): normalized email ${normalizedEmail} already exists for another user`
        )
        skippedCount++
        continue
      }

      // Update email
      await prisma.user.update({
        where: { id: user.id },
        data: { email: normalizedEmail },
      })

      console.log(
        `✅ Updated: ${user.name}\n   ${user.email} → ${normalizedEmail}`
      )
      updatedCount++
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 SUMMARY')
    console.log('='.repeat(50))
    console.log(`✅ Updated: ${updatedCount} users`)
    console.log(`⏭️  Skipped: ${skippedCount} users`)
    console.log(`📦 Total users: ${users.length}`)
    console.log('='.repeat(50))
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

normalizeEmails()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

