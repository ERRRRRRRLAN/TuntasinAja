import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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

async function main() {
  console.log('🚀 Starting to add XI BC 1 students...\n')

  // 1. Create subscription for XI BC 1 (7 days)
  console.log('📝 Creating subscription for XI BC 1 (7 days)...')
  
  // Check if subscription already exists
  const existingSubscription = await prisma.classSubscription.findUnique({
    where: { kelas: 'XI BC 1' },
  })

  let subscription
  if (existingSubscription) {
    console.log('⚠️  Subscription already exists, updating end date...')
    subscription = await prisma.classSubscription.update({
      where: { kelas: 'XI BC 1' },
      data: {
        subscriptionEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    })
  } else {
    subscription = await prisma.classSubscription.create({
      data: {
        kelas: 'XI BC 1',
        subscriptionEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    })
  }
  console.log(`✅ Subscription set: expires ${subscription.subscriptionEndDate.toLocaleDateString('id-ID')}\n`)

  // 2. Create users
  console.log('👥 Creating users...\n')
  let successCount = 0
  let errorCount = 0

  for (const student of students) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(student.password, 10)

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: student.email },
      })

      if (existingUser) {
        console.log(`⚠️  User already exists: ${student.email}`)
        errorCount++
        continue
      }

      // Create user
      const user = await prisma.user.create({
          data: {
            email: student.email,
            passwordHash: hashedPassword,
            name: student.name,
            kelas: 'XI BC 1',
            isDanton: student.isDanton || false,
            isAdmin: false,
          } as any,
      })

      console.log(
        `✅ Created: ${student.name} ${student.isDanton ? '(DANTON)' : ''}`
      )
      successCount++
    } catch (error) {
      console.error(`❌ Error creating user ${student.name}:`, error)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Successfully created: ${successCount} users`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📦 Total students: ${students.length}`)
  console.log(`📅 Subscription: 7 days`)
  console.log(`🎓 Class: XI BC 1`)
  console.log('='.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

