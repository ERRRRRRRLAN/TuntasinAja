const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Password dari tabel (sesuai dengan TABEL-USER-X-RPL-1.md)
const userPasswords = [
  { email: 'adittia@tuntasinaja.com', password: 'adittia732' },
  { email: 'aisyah@tuntasinaja.com', password: 'aisyah503' },
  { email: 'akbar@tuntasinaja.com', password: 'akbar524' },
  { email: 'alvian@tuntasinaja.com', password: 'alvian191' },
  { email: 'arya@tuntasinaja.com', password: 'arya882' },
  { email: 'banu@tuntasinaja.com', password: 'banu433' },
  { email: 'bilal@tuntasinaja.com', password: 'bilal395' },
  { email: 'chayara@tuntasinaja.com', password: 'chayara184' },
  { email: 'citra@tuntasinaja.com', password: 'citra516' },
  { email: 'erlan@tuntasinaja.com', password: 'erlan969' },
  { email: 'farid@tuntasinaja.com', password: 'farid622' },
  { email: 'fathiya@tuntasinaja.com', password: 'fathiya977' },
  { email: 'hafizh@tuntasinaja.com', password: 'hafizh887' },
  { email: 'joel@tuntasinaja.com', password: 'joel847' },
  { email: 'keisya@tuntasinaja.com', password: 'keisya768' },
  { email: 'liza@tuntasinaja.com', password: 'liza739' },
  { email: 'makarim@tuntasinaja.com', password: 'makarim374' },
  { email: 'misbahudin@tuntasinaja.com', password: 'misbahudin999' },
  { email: 'muhamad@tuntasinaja.com', password: 'muhamad633' },
  { email: 'hanif@tuntasinaja.com', password: 'muhammad379' },
  { email: 'mukhlasa@tuntasinaja.com', password: 'mukhlasa317' },
  { email: 'nadira@tuntasinaja.com', password: 'nadira731' },
  { email: 'najwan@tuntasinaja.com', password: 'najwan325' },
  { email: 'oktafiya@tuntasinaja.com', password: 'oktafiya399' },
  { email: 'radhiya@tuntasinaja.com', password: 'radhiya175' },
  { email: 'raditya@tuntasinaja.com', password: 'raditya959' },
  { email: 'rafsya@tuntasinaja.com', password: 'rafsya607' },
  { email: 'indra@tuntasinaja.com', password: 'ravindra923' },
  { email: 'ravindra@tuntasinaja.com', password: 'ravindra745' },
  { email: 'renza@tuntasinaja.com', password: 'rhenza368' },
  { email: 'rhenza@tuntasinaja.com', password: 'rhenza677' },
  { email: 'risti@tuntasinaja.com', password: 'risti383' },
  { email: 'shaqeela@tuntasinaja.com', password: 'shaqeela602' },
  { email: 'yudha@tuntasinaja.com', password: 'yudha693' },
]

async function main() {
  console.log('🚀 Updating passwords for X RPL 1 users...\n')

  let successCount = 0
  let errorCount = 0
  const results = []

  for (const { email, password } of userPasswords) {
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

      // Check if user is in X RPL 1
      if (user.kelas !== 'X RPL 1') {
        console.log(`⚠️  User ${email} is not in X RPL 1 (kelas: ${user.kelas})`)
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

      results.push({ name: user.name, email, password })
      successCount++
    } catch (error) {
      console.error(`❌ Error updating password for ${email}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)

  if (results.length > 0) {
    console.log('\n📋 Updated Users:')
    results.forEach(({ name, email, password }) => {
      console.log(`   ${name.padEnd(35)} ${email.padEnd(30)} ${password}`)
    })
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })




