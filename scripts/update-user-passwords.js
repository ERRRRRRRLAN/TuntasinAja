const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// List of users
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

// Function to get first name for email
function getFirstName(fullName) {
  return fullName.split(' ')[0].toLowerCase()
}

// Function to generate password based on name
function generatePassword(fullName) {
  const firstName = getFirstName(fullName)
  // Create password: firstname + 3 digit number based on name hash
  const nameHash = fullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const number = (nameHash % 900) + 100 // 3 digit number (100-999)
  return `${firstName}${number}`
}

async function main() {
  console.log('🚀 Updating user passwords...\n')

  const passwords = []
  let successCount = 0
  let errorCount = 0

  for (const fullName of users) {
    try {
      const firstName = getFirstName(fullName)
      const email = `${firstName}@tuntasinaja.com`
      const password = generatePassword(fullName)
      const passwordHash = await bcrypt.hash(password, 10)

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        console.log(`⚠️  User not found: ${email}`)
        errorCount++
        continue
      }

      // Update password
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
        },
      })

      console.log(`✅ Updated: ${user.name}`)
      console.log(`   Email: ${email}`)
      console.log(`   Password: ${password}\n`)

      passwords.push({ name: user.name, email, password })
      successCount++
    } catch (error) {
      console.error(`❌ Error updating user ${fullName}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log('\n📋 Password List:')
  passwords.forEach(({ name, email, password }) => {
    console.log(`   ${name.padEnd(35)} ${email.padEnd(30)} ${password}`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

