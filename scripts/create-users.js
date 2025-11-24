const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// List of users to create
const users = [
  'ADITTIA RAMADHAN',
  'AISYAH SALSABILA SOFYAN',
  'AKBAR ALFITRAH',
  'ALVIAN HIDAYATULLOH',
  'ARYA FEBRIYANSYAH',
  'BANU ARKA FINO',
  'BILAL SHAKITRY AQILLAH',
  'CHAYARA NAYLA SYARIF',
  'CITRA AIRA DANA',
  'FARID ATHAILLAH',
  'FATHIYA NUHA ZAHIRA',
  'HAFIZH AHMAD MA\'RUF',
  'JOEL MACCREA KENAZ',
  'KEISYA ELYSYA SISKA SYAFET',
  'LIZA AULIA HANAFI',
  'MAKARIM AHMAD MUHARRAM',
  'MISBAHUDIN MARZUKI',
  'MUHAMAD RAMDANI',
  'MUHAMMAD HANIF RIZALDI',
  'MUKHLASA RIFKY SIHITE',
  'NADIRA SALSABILA',
  'NAJWAN NAFIDZ NUYANTO',
  'OKTAFIYA SRI HANDAYANI',
  'RADHIYA IKRAM ATHMAR',
  'RADITYA EGA DASILVA',
  'RAFSYA AL-MIZAN',
  'RAVINDRA HAMDANI',
  'RHENZA ISZAQ PUTRA RAZAVI',
  'RISTI PAIRUS',
  'SHAQEELA REZKY RAMADHANI',
  'YUDHA NUR WIJAYA',
]

// Function to capitalize name properly (Title Case)
function capitalizeName(name) {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Function to get first name for email
function getFirstName(fullName) {
  return fullName.split(' ')[0].toLowerCase()
}

async function main() {
  console.log('🚀 Creating users...\n')

  const password = 'tuntasinaja123' // Simple password
  const passwordHash = await bcrypt.hash(password, 10)
  const kelas = 'X RPL 1'

  let successCount = 0
  let errorCount = 0

  for (const fullName of users) {
    try {
      const name = capitalizeName(fullName)
      const firstName = getFirstName(fullName)
      const email = `${firstName}@tuntasinaja.com`

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        console.log(`⚠️  User already exists: ${name} (${email})`)
        continue
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          kelas,
        },
      })

      console.log(`✅ Created: ${name}`)
      console.log(`   Email: ${email}`)
      console.log(`   Password: ${password}`)
      console.log(`   Kelas: ${kelas}\n`)

      successCount++
    } catch (error) {
      console.error(`❌ Error creating user ${fullName}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`\n🔑 Default password for all users: ${password}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

