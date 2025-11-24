const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// List of users from CSV
const users = [
  { name: 'ADITTIA RAMADHAN', email: 'adittia@tuntasinaja.com' },
  { name: 'AISYAH SALSABILA SOFYAN', email: 'aisyah@tuntasinaja.com' },
  { name: 'AKBAR ALFITRAH', email: 'akbar@tuntasinaja.com' },
  { name: 'ALVIAN HIDAYATULLOH', email: 'alvian@tuntasinaja.com' },
  { name: 'ARYA FEBRIYANSYAH', email: 'arya@tuntasinaja.com' },
  { name: 'BANU ARKA FINO', email: 'banu@tuntasinaja.com' },
  { name: 'BILAL SHAKITRY AQILLAH', email: 'bilal@tuntasinaja.com' },
  { name: 'CHAYARA NAYLA SYARIF', email: 'chayara@tuntasinaja.com' },
  { name: 'CITRA AIRA DANA', email: 'citra@tuntasinaja.com' },
  { name: 'FARID ATHAILLAH', email: 'farid@tuntasinaja.com' },
  { name: 'FATHIYA NUHA ZAHIRA', email: 'fathiya@tuntasinaja.com' },
  { name: 'HAFIZH AHMAD MA\'RUF', email: 'hafizh@tuntasinaja.com' },
  { name: 'JOEL MACCREA KENAZ', email: 'joel@tuntasinaja.com' },
  { name: 'KEISYA ELYSYA SISKA SYAFET', email: 'keisya@tuntasinaja.com' },
  { name: 'LIZA AULIA HANAFI', email: 'liza@tuntasinaja.com' },
  { name: 'MAKARIM AHMAD MUHARRAM', email: 'makarim@tuntasinaja.com' },
  { name: 'MISBAHUDIN MARZUKI', email: 'misbahudin@tuntasinaja.com' },
  { name: 'MUHAMAD RAMDANI', email: 'muhamad@tuntasinaja.com' },
  { name: 'MUHAMMAD HANIF RIZALDI', email: 'hanif@tuntasinaja.com' },
  { name: 'MUKHLASA RIFKY SIHITE', email: 'mukhlasa@tuntasinaja.com' },
  { name: 'NADIRA SALSABILA', email: 'nadira@tuntasinaja.com' },
  { name: 'NAJWAN NAFIDZ NUYANTO', email: 'najwan@tuntasinaja.com' },
  { name: 'OKTAFIYA SRI HANDAYANI', email: 'oktafiya@tuntasinaja.com' },
  { name: 'RADHIYA IKRAM ATHMAR', email: 'radhiya@tuntasinaja.com' },
  { name: 'RADITYA EGA DASILVA', email: 'raditya@tuntasinaja.com' },
  { name: 'RAFSYA AL-MIZAN', email: 'rafsya@tuntasinaja.com' },
  { name: 'RAVINDRA HAMDANI', email: 'ravindra@tuntasinaja.com' },
  { name: 'RHENZA ISZAQ PUTRA RAZAVI', email: 'rhenza@tuntasinaja.com' },
  { name: 'RISTI PAIRUS', email: 'risti@tuntasinaja.com' },
  { name: 'SHAQEELA REZKY RAMADHANI', email: 'shaqeela@tuntasinaja.com' },
  { name: 'YUDHA NUR WIJAYA', email: 'yudha@tuntasinaja.com' },
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

// Function to capitalize name properly (Title Case)
function capitalizeName(name) {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function main() {
  console.log('# Tabel Email dan Username - X RPL 1\n')
  console.log('## Daftar Lengkap Siswa X RPL 1\n')
  console.log('| No | Nama Lengkap | Email | Password |')
  console.log('|----|--------------|-------|----------|')

  const userData = []

  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const name = capitalizeName(user.name)
    const password = generatePassword(user.name)
    userData.push({ name, email: user.email, password })
    
    console.log(`| ${i + 1} | ${name} | ${user.email} | ${password} |`)
  }

  console.log(`\n**Total: ${userData.length} siswa**\n`)
  console.log('## Format Text\n')
  console.log('Email dan Username X RPL 1:\n')
  
  userData.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: ${user.password}\n`)
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



