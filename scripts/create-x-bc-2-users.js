#!/usr/bin/env node

/**
 * Script untuk membuat user X BC 2
 * 
 * Usage:
 *   node scripts/create-x-bc-2-users.js
 * 
 * Pastikan DATABASE_URL sudah di-set di environment variable atau .env
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// List of users X BC 2 (Aldira Lintang akan dipindah ke akhir)
const users = [
  'ANGELIA BANOWATI YUSUF',
  'APRILIA TRI ANANDA',
  'AUREL DESTIYANA SYAHID',
  'AZRIL AZKA ALFIANSYAH',
  'BELLA FAJARIAH',
  'DIAH ADILA PUTRI',
  'DIVA AHRUN NISA',
  'EVI MULYANI',
  'FARHAN SAPUTRA',
  'GALIH ANUGRAH',
  'HAFIZ MAULANA',
  'KAILA SUCI RAMADHANI',
  'KAYLA SYAUMA RAFSYANJANI',
  'KEYSAFFA ANJELITA',
  'MARIA',
  'MELY RACMARYNATA',
  'MUHAMMAD FACHRI',
  'MUHAMMAD RAFFA PRATAMA',
  'NADINE',
  'NAYLA MUTIA HAFI',
  'NOVA DIANI MURNI',
  'NUR AZZAHRA KHALIQA',
  'PUTRI CHOIRUNNISA',
  'RAFIFAH RAMADHANI',
  'RAJWA KHAYLILA PUTRI',
  'RAKA BAGASKARA SUKANDAR',
  'RESTU OKTAVIANTORO',
  'RISKA MEILANI SANJAYA',
  'SALSABIL ADINA FARAH S',
  'SHAFIRA AULIA RAHMAN',
  'SOULU AZALITA SAFITRI',
  'VIRA AULIA NISA',
  'ZAARA ANDRIANI',
  'ZAKI IKHWAN PERMANA',
  'ALDIRRA LINTANG', // Dipindah ke akhir sesuai permintaan
]

// Function to capitalize name properly (Title Case)
function capitalizeName(name) {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Function to get first and second word for email
function getEmailFromName(fullName) {
  const words = fullName.trim().split(/\s+/)
  if (words.length >= 2) {
    return `${words[0].toLowerCase()}${words[1].toLowerCase()}`
  } else {
    // Jika hanya satu kata, gunakan kata tersebut dua kali
    return `${words[0].toLowerCase()}${words[0].toLowerCase()}`
  }
}

// Function to generate password: first word + second word + 5 random digits
function generatePassword(fullName) {
  const words = fullName.trim().split(/\s+/)
  let passwordBase = ''
  
  if (words.length >= 2) {
    passwordBase = `${words[0].toLowerCase()}${words[1].toLowerCase()}`
  } else {
    // Jika hanya satu kata, gunakan kata tersebut dua kali
    passwordBase = `${words[0].toLowerCase()}${words[0].toLowerCase()}`
  }
  
  // Generate 5 random digits
  const randomDigits = Math.floor(10000 + Math.random() * 90000)
  
  return `${passwordBase}${randomDigits}`
}

async function main() {
  console.log('🚀 Creating users for X BC 2...\n')

  const kelas = 'X BC 2'
  const domain = 'tuntasinaja.com'

  let successCount = 0
  let errorCount = 0

  const userList = []

  for (const fullName of users) {
    try {
      const name = capitalizeName(fullName)
      const emailBase = getEmailFromName(fullName)
      const email = `${emailBase}@${domain}`
      const password = generatePassword(fullName)
      const passwordHash = await bcrypt.hash(password, 10)

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        console.log(`⚠️  User already exists: ${name} (${email})`)
        userList.push({ name, email, password })
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

      userList.push({ name, email, password })
      successCount++
    } catch (error) {
      console.error(`❌ Error creating user ${fullName}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   ⚠️  Already exists: ${userList.length - successCount}`)

  // Generate markdown file
  const mdContent = generateMarkdown(userList)
  const mdPath = path.join(__dirname, '..', 'X-BC-2-USERS.md')
  fs.writeFileSync(mdPath, mdContent, 'utf-8')
  console.log(`\n📄 Markdown file created: ${mdPath}`)

  // Also print to console
  console.log('\n📋 User List (Email & Password):')
  console.log('='.repeat(80))
  userList.forEach(({ name, email, password }, index) => {
    console.log(`${(index + 1).toString().padStart(2, '0')}. ${name.padEnd(40)} ${email.padEnd(35)} ${password}`)
  })
  console.log('='.repeat(80))
}

function generateMarkdown(userList) {
  let md = '# Daftar Email dan Password - X BC 2\n\n'
  md += '| No | Nama | Email | Password |\n'
  md += '|----|------|-------|----------|\n'

  userList.forEach(({ name, email, password }, index) => {
    md += `| ${index + 1} | ${name} | ${email} | ${password} |\n`
  })

  md += `\n**Total: ${userList.length} siswa**\n`
  md += `\n**Catatan:** Aldira Lintang ditaruh di paling akhir sesuai permintaan.\n`

  return md
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

