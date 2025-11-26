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
    email: 'abelyolanda@gmail.com',
    password: 'AbelYolanda2847',
    isDanton: true, // DANTON
  },
  {
    name: 'Alifa Jatil Ijah',
    email: 'alifajatil@gmail.com',
    password: 'AlifaJatil9315',
  },
  {
    name: 'Amanda Putri Alfiani',
    email: 'amandaputri@gmail.com',
    password: 'AmandaPutri4521',
  },
  {
    name: 'Arel Gamaulana',
    email: 'arelgamaulana@gmail.com',
    password: 'ArelGamaulana7638',
  },
  {
    name: 'Saruni Kamila Utami',
    email: 'sarunikamila@gmail.com',
    password: 'SaruniKamila1923',
  },
  {
    name: 'Saura Sakilla Rudini',
    email: 'saurasakilla@gmail.com',
    password: 'SauraSakilla5749',
  },
  {
    name: 'Aurel Danu Pratama',
    email: 'aureldanu@gmail.com',
    password: 'AurelDanu3856',
  },
  {
    name: 'Banyu Pangestu',
    email: 'banyupangestu@gmail.com',
    password: 'BanyuPangestu2194',
  },
  {
    name: 'Bella Amanda',
    email: 'bellaamanda@gmail.com',
    password: 'BellaAmanda6472',
  },
  {
    name: 'Bianca Desfa Ayundari',
    email: 'biancadesfa@gmail.com',
    password: 'BiancaDesfa8315',
  },
  {
    name: 'Cahaya Aulia',
    email: 'cahayaaulia@gmail.com',
    password: 'CahayaAulia9527',
  },
  {
    name: 'Cristhoper Gora Parha',
    email: 'cristhopergora@gmail.com',
    password: 'CristhoperGora4168',
  },
  {
    name: 'Erdi Saputra',
    email: 'erdisaputra@gmail.com',
    password: 'ErdiSaputra7391',
  },
  {
    name: 'Fabian Muhammad Cheynet',
    email: 'fabianmuhammad@gmail.com',
    password: 'FabianMuhammad5824',
  },
  {
    name: 'Fathir Ahmad Sharezad',
    email: 'fathirahmad@gmail.com',
    password: 'FathirAhmad3679',
  },
  {
    name: 'Helwa Nida Luthfiah',
    email: 'helwanida@gmail.com',
    password: 'HelwaNida1245',
  },
  {
    name: 'Istiqomah',
    email: 'istiqomah@gmail.com',
    password: 'Istiqomah8932',
  },
  {
    name: 'Kesya Safira',
    email: 'kesyasafira@gmail.com',
    password: 'KesyaSafira4576',
  },
  {
    name: 'Khansa Syafiqah Aurellia',
    email: 'khansasyafiqah@gmail.com',
    password: 'KhansaSyafiqah9213',
  },
  {
    name: 'Kholishah Rizki Kamilatunnisa',
    email: 'kholishahrizki@gmail.com',
    password: 'KholishahRizki6847',
  },
  {
    name: 'Maesya Safinatunazza Ghiffari',
    email: 'maesyasafinatunazza@gmail.com',
    password: 'MaesyaSafinatunazza3158',
  },
  {
    name: 'Mamara Azka Muhana Sakti',
    email: 'mamaraazka@gmail.com',
    password: 'MamaraAzka7429',
  },
  {
    name: 'Mischa Rachmadianty',
    email: 'mischarachmadianty@gmail.com',
    password: 'MischaRachmadianty5681',
  },
  {
    name: 'Muhamad Ajril Ilham',
    email: 'muhamadajril@gmail.com',
    password: 'MuhamadAjril2937',
  },
  {
    name: 'Muhamad Fairul Azka',
    email: 'muhamadfairul@gmail.com',
    password: 'MuhamadFairul8164',
  },
  {
    name: 'Muhammad Aria Pakula',
    email: 'muhammadaria@gmail.com',
    password: 'MuhammadAria4752',
  },
  {
    name: 'Muthi Naura Sabitha',
    email: 'muthinaura@gmail.com',
    password: 'MuthiNaura9385',
  },
  {
    name: 'Nayla Oktafia',
    email: 'naylaoktafia@gmail.com',
    password: 'NaylaOktafia6219',
  },
  {
    name: 'Nayra Kanisya Putri',
    email: 'nayrakanisya@gmail.com',
    password: 'NayraKanisya3847',
  },
  {
    name: 'Noni Juleha',
    email: 'nonijuleha@gmail.com',
    password: 'NoniJuleha5926',
  },
  {
    name: 'Noviana Nila Sukma',
    email: 'noviananila@gmail.com',
    password: 'NovianaNila1473',
  },
  {
    name: 'Octavia Safitri',
    email: 'octaviasafitri@gmail.com',
    password: 'OctaviaSafitri8542',
  },
  {
    name: 'Pahroji Hidayatuloh',
    email: 'pahrojihidayatuloh@gmail.com',
    password: 'PahrojiHidayatuloh2698',
  },
  {
    name: 'Rizky Fadila Ramadhon',
    email: 'rizkyfadila@gmail.com',
    password: 'RizkyFadila7351',
  },
  {
    name: 'Shifa Fauziah',
    email: 'shifafauziah@gmail.com',
    password: 'ShifaFauziah4829',
  },
  {
    name: 'Siska Wulandari',
    email: 'siskawulandari@gmail.com',
    password: 'SiskaWulandari9176',
  },
  {
    name: 'Syifa Keisa Audia',
    email: 'syifakeisa@gmail.com',
    password: 'SyifaKeisa6384',
  },
  {
    name: 'Tiara Salsabila',
    email: 'tiarasalsabila@gmail.com',
    password: 'TiaraSalsabila5217',
  },
  {
    name: 'Verlita Azzahra',
    email: 'verlitaazzahra@gmail.com',
    password: 'VerlitaAzzahra8935',
  },
  {
    name: 'Zulfa Raihana Putri',
    email: 'zulfaraihana@gmail.com',
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

