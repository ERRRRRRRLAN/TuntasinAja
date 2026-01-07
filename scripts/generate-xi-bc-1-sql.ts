import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface Student {
  name: string
  email: string
  password: string
  isDanton?: boolean
}

const students: Student[] = [
  {
    name: 'Abel Yolanda Rahmadani',
    email: 'abelyolanda@tuntasinaja.com',
    password: 'AbelYolanda2847',
    isDanton: true, // DANTON
  },
  {
    name: 'Alifa Jatil Ijah',
    email: 'alifajatil@tuntasinaja.com',
    password: 'AlifaJatil9315',
  },
  {
    name: 'Amanda Putri Alfiani',
    email: 'amandaputri@tuntasinaja.com',
    password: 'AmandaPutri4521',
  },
  {
    name: 'Arel Gamaulana',
    email: 'arelgamaulana@tuntasinaja.com',
    password: 'ArelGamaulana7638',
  },
  {
    name: 'Saruni Kamila Utami',
    email: 'sarunikamila@tuntasinaja.com',
    password: 'SaruniKamila1923',
  },
  {
    name: 'Saura Sakilla Rudini',
    email: 'saurasakilla@tuntasinaja.com',
    password: 'SauraSakilla5749',
  },
  {
    name: 'Aurel Danu Pratama',
    email: 'aureldanu@tuntasinaja.com',
    password: 'AurelDanu3856',
  },
  {
    name: 'Banyu Pangestu',
    email: 'banyupangestu@tuntasinaja.com',
    password: 'BanyuPangestu2194',
  },
  {
    name: 'Bella Amanda',
    email: 'bellaamanda@tuntasinaja.com',
    password: 'BellaAmanda6472',
  },
  {
    name: 'Bianca Desfa Ayundari',
    email: 'biancadesfa@tuntasinaja.com',
    password: 'BiancaDesfa8315',
  },
  {
    name: 'Cahaya Aulia',
    email: 'cahayaaulia@tuntasinaja.com',
    password: 'CahayaAulia9527',
  },
  {
    name: 'Cristhoper Gora Parha',
    email: 'cristhopergora@tuntasinaja.com',
    password: 'CristhoperGora4168',
  },
  {
    name: 'Erdi Saputra',
    email: 'erdisaputra@tuntasinaja.com',
    password: 'ErdiSaputra7391',
  },
  {
    name: 'Fabian Muhammad Cheynet',
    email: 'fabianmuhammad@tuntasinaja.com',
    password: 'FabianMuhammad5824',
  },
  {
    name: 'Fathir Ahmad Sharezad',
    email: 'fathirahmad@tuntasinaja.com',
    password: 'FathirAhmad3679',
  },
  {
    name: 'Helwa Nida Luthfiah',
    email: 'helwanida@tuntasinaja.com',
    password: 'HelwaNida1245',
  },
  {
    name: 'Istiqomah',
    email: 'istiqomah@tuntasinaja.com',
    password: 'Istiqomah8932',
  },
  {
    name: 'Kesya Safira',
    email: 'kesyasafira@tuntasinaja.com',
    password: 'KesyaSafira4576',
  },
  {
    name: 'Khansa Syafiqah Aurellia',
    email: 'khansasyafiqah@tuntasinaja.com',
    password: 'KhansaSyafiqah9213',
  },
  {
    name: 'Kholishah Rizki Kamilatunnisa',
    email: 'kholishahrizki@tuntasinaja.com',
    password: 'KholishahRizki6847',
  },
  {
    name: 'Maesya Safinatunazza Ghiffari',
    email: 'maesyasafinatunazza@tuntasinaja.com',
    password: 'MaesyaSafinatunazza3158',
  },
  {
    name: 'Mamara Azka Muhana Sakti',
    email: 'mamaraazka@tuntasinaja.com',
    password: 'MamaraAzka7429',
  },
  {
    name: 'Mischa Rachmadianty',
    email: 'mischarachmadianty@tuntasinaja.com',
    password: 'MischaRachmadianty5681',
  },
  {
    name: 'Muhamad Ajril Ilham',
    email: 'muhamadajril@tuntasinaja.com',
    password: 'MuhamadAjril2937',
  },
  {
    name: 'Muhamad Fairul Azka',
    email: 'muhamadfairul@tuntasinaja.com',
    password: 'MuhamadFairul8164',
  },
  {
    name: 'Muhammad Aria Pakula',
    email: 'muhammadaria@tuntasinaja.com',
    password: 'MuhammadAria4752',
  },
  {
    name: 'Muthi Naura Sabitha',
    email: 'muthinaura@tuntasinaja.com',
    password: 'MuthiNaura9385',
  },
  {
    name: 'Nayla Oktafia',
    email: 'naylaoktafia@tuntasinaja.com',
    password: 'NaylaOktafia6219',
  },
  {
    name: 'Nayra Kanisya Putri',
    email: 'nayrakanisya@tuntasinaja.com',
    password: 'NayraKanisya3847',
  },
  {
    name: 'Noni Juleha',
    email: 'nonijuleha@tuntasinaja.com',
    password: 'NoniJuleha5926',
  },
  {
    name: 'Noviana Nila Sukma',
    email: 'noviananila@tuntasinaja.com',
    password: 'NovianaNila1473',
  },
  {
    name: 'Octavia Safitri',
    email: 'octaviasafitri@tuntasinaja.com',
    password: 'OctaviaSafitri8542',
  },
  {
    name: 'Pahroji Hidayatuloh',
    email: 'pahrojihidayatuloh@tuntasinaja.com',
    password: 'PahrojiHidayatuloh2698',
  },
  {
    name: 'Rizky Fadila Ramadhon',
    email: 'rizkyfadila@tuntasinaja.com',
    password: 'RizkyFadila7351',
  },
  {
    name: 'Shifa Fauziah',
    email: 'shifafauziah@tuntasinaja.com',
    password: 'ShifaFauziah4829',
  },
  {
    name: 'Siska Wulandari',
    email: 'siskawulandari@tuntasinaja.com',
    password: 'SiskaWulandari9176',
  },
  {
    name: 'Syifa Keisa Audia',
    email: 'syifakeisa@tuntasinaja.com',
    password: 'SyifaKeisa6384',
  },
  {
    name: 'Tiara Salsabila',
    email: 'tiarasalsabila@tuntasinaja.com',
    password: 'TiaraSalsabila5217',
  },
  {
    name: 'Verlita Azzahra',
    email: 'verlitaazzahra@tuntasinaja.com',
    password: 'VerlitaAzzahra8935',
  },
  {
    name: 'Zulfa Raihana Putri',
    email: 'zulfaraihana@tuntasinaja.com',
    password: 'ZulfaRaihana4761',
  },
]

async function generateSQL() {
  console.log('🚀 Generating SQL script for XI BC 1 users...\n')

  const sqlLines: string[] = []
  
  // Header
  sqlLines.push('-- ============================================')
  sqlLines.push('-- SCRIPT SQL: CREATE/UPDATE XI BC 1 USERS')
  sqlLines.push('-- Email dan password sudah dinormalisasi')
  sqlLines.push('-- Password sudah di-hash dengan bcrypt (rounds: 10)')
  sqlLines.push('-- ============================================')
  sqlLines.push('')
  sqlLines.push('-- Hapus user XI BC 1 yang sudah ada (optional - uncomment jika perlu)')
  sqlLines.push('-- DELETE FROM users WHERE kelas = \'XI BC 1\';')
  sqlLines.push('')
  sqlLines.push('-- Buat/Update subscription untuk XI BC 1 (7 hari)')
  sqlLines.push('INSERT INTO class_subscriptions (kelas, subscription_end_date, created_at, updated_at)')
  sqlLines.push('VALUES (\'XI BC 1\', NOW() + INTERVAL \'7 days\', NOW(), NOW())')
  sqlLines.push('ON CONFLICT (kelas) DO UPDATE SET')
  sqlLines.push('  subscription_end_date = NOW() + INTERVAL \'7 days\',')
  sqlLines.push('  updated_at = NOW();')
  sqlLines.push('')
  sqlLines.push('-- ============================================')
  sqlLines.push('-- INSERT USERS')
  sqlLines.push('-- ============================================')
  sqlLines.push('')

  // Generate SQL for each student
  for (const student of students) {
    // Normalize email
    const normalizedEmail = student.email.trim().toLowerCase()
    
    // Hash password
    const passwordHash = await bcrypt.hash(student.password, 10)
    
    // Escape single quotes in name and email
    const escapedName = student.name.replace(/'/g, "''")
    const escapedEmail = normalizedEmail.replace(/'/g, "''")
    
    // Generate SQL INSERT with ON CONFLICT UPDATE
    sqlLines.push(`-- ${student.name} ${student.isDanton ? '(DANTON)' : ''}`)
    sqlLines.push(`INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)`)
    sqlLines.push(`VALUES (`)
    sqlLines.push(`  gen_random_uuid(),`)
    sqlLines.push(`  '${escapedName}',`)
    sqlLines.push(`  '${escapedEmail}',`)
    sqlLines.push(`  '${passwordHash}',`)
    sqlLines.push(`  'XI BC 1',`)
    sqlLines.push(`  false,`)
    sqlLines.push(`  ${student.isDanton ? 'true' : 'false'},`)
    sqlLines.push(`  NOW(),`)
    sqlLines.push(`  NOW()`)
    sqlLines.push(`)`)
    sqlLines.push(`ON CONFLICT (email) DO UPDATE SET`)
    sqlLines.push(`  name = EXCLUDED.name,`)
    sqlLines.push(`  password_hash = EXCLUDED.password_hash,`)
    sqlLines.push(`  kelas = EXCLUDED.kelas,`)
    sqlLines.push(`  is_admin = EXCLUDED.is_admin,`)
    sqlLines.push(`  is_danton = EXCLUDED.is_danton,`)
    sqlLines.push(`  updated_at = NOW();`)
    sqlLines.push('')
  }

  // Footer
  sqlLines.push('-- ============================================')
  sqlLines.push(`-- TOTAL: ${students.length} users (${students.filter(s => s.isDanton).length} Danton + ${students.filter(s => !s.isDanton).length} Siswa)`)
  sqlLines.push('-- KELAS: XI BC 1')
  sqlLines.push('-- SUBSCRIPTION: 7 Hari')
  sqlLines.push('-- ============================================')

  // Write to file
  const outputPath = path.join(__dirname, 'recreate-xi-bc-1-users.sql')
  fs.writeFileSync(outputPath, sqlLines.join('\n'), 'utf-8')

  console.log(`✅ SQL script generated successfully!`)
  console.log(`   File: ${outputPath}`)
  console.log(`   Total users: ${students.length}`)
  console.log(`   Danton: ${students.filter(s => s.isDanton).length}`)
  console.log(`   Siswa: ${students.filter(s => !s.isDanton).length}\n`)
}

generateSQL()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

