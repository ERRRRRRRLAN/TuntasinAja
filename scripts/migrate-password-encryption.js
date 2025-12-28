// Load environment variables from .env file
require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const { encryptPassword } = require('../lib/password-encryption')

const prisma = new PrismaClient()

// Mapping password dari USER-PASSWORDS.md
const passwordMap = {
  // Admin
  'admin@tuntasinaja.com': '210609190210',
  
  // X RPL 1
  'adittia@tuntasinaja.com': 'adittia732',
  'aisyah@tuntasinaja.com': 'aisyah503',
  'akbar@tuntasinaja.com': 'akbar524',
  'alvian@tuntasinaja.com': 'alvian191',
  'arya@tuntasinaja.com': 'arya882',
  'banu@tuntasinaja.com': 'banu433',
  'bilal@tuntasinaja.com': 'bilal395',
  'chayara@tuntasinaja.com': 'chayara184',
  'citra@tuntasinaja.com': 'citra516',
  'erlan@tuntasinaja.com': 'erlan969',
  'farid@tuntasinaja.com': 'farid622',
  'fathiya@tuntasinaja.com': 'fathiya977',
  'hafizh@tuntasinaja.com': 'hafizh887',
  'joel@tuntasinaja.com': 'joel847',
  'keisya@tuntasinaja.com': 'keisya768',
  'liza@tuntasinaja.com': 'liza739',
  'makarim@tuntasinaja.com': 'makarim374',
  'misbahudin@tuntasinaja.com': 'misbahudin999',
  'muhamad@tuntasinaja.com': 'muhamad633',
  'hanif@tuntasinaja.com': 'muhammad379',
  'mukhlasa@tuntasinaja.com': 'mukhlasa317',
  'nadira@tuntasinaja.com': 'nadira731',
  'najwan@tuntasinaja.com': 'najwan325',
  'oktafiya@tuntasinaja.com': 'oktafiya399',
  'radhiya@tuntasinaja.com': 'radhiya175',
  'raditya@tuntasinaja.com': 'raditya959',
  'rafsya@tuntasinaja.com': 'rafsya607',
  'ravindra@tuntasinaja.com': 'ravindra745',
  'rhenza@tuntasinaja.com': 'rhenza677',
  'risti@tuntasinaja.com': 'risti383',
  'shaqeela@tuntasinaja.com': 'shaqeela602',
  'yudha@tuntasinaja.com': 'yudha321',
  
  // XI BC 1
  'abelyolanda@tuntasinaja.com': 'AbelYolanda2847',
  'alifajatil@tuntasinaja.com': 'AlifaJatil9315',
  'amandaputri@tuntasinaja.com': 'AmandaPutri4521',
  'arelgamaulana@tuntasinaja.com': 'ArelGamaulana7638',
  'sarunikamila@tuntasinaja.com': 'SaruniKamila1923',
  'aureldanu@tuntasinaja.com': 'AurelDanu3856',
  'bellaamanda@tuntasinaja.com': 'BellaAmanda6472',
  'biancadesfa@tuntasinaja.com': 'BiancaDesfa8315',
  'cahayaaulia@tuntasinaja.com': 'CahayaAulia9527',
  'cristhopergora@tuntasinaja.com': 'CristhoperGora4168',
  'erdisaputra@tuntasinaja.com': 'ErdiSaputra7391',
  'fathirahmad@tuntasinaja.com': 'FathirAhmad3679',
  'helwanida@tuntasinaja.com': 'HelwaNida1245',
  'istiqomah@tuntasinaja.com': 'Istiqomah8932',
  'kesyasafira@tuntasinaja.com': 'KesyaSafira4576',
  'khansasyafiqah@tuntasinaja.com': 'KhansaSyafiqah9213',
  'kholishahrizki@tuntasinaja.com': 'KholishahRizki6847',
  'maesyasafinatunazza@tuntasinaja.com': 'MaesyaSafinatunazza3158',
  'mamaraazka@tuntasinaja.com': 'MamaraAzka7429',
  'mischarachmadianty@tuntasinaja.com': 'MischaRachmadianty5681',
  'muhamadajril@tuntasinaja.com': 'MuhamadAjril2937',
  'muhamadfairul@tuntasinaja.com': 'MuhamadFairul8164',
  'muhammadaria@tuntasinaja.com': 'MuhammadAria4752',
  'muthinaura@tuntasinaja.com': 'MuthiNaura9385',
  'naylaoktafia@tuntasinaja.com': 'NaylaOktafia6219',
  'nayrakanisya@tuntasinaja.com': 'NayraKanisya3847',
  'octaviasafitri@tuntasinaja.com': 'OctaviaSafitri8542',
  'pahrojihidayatuloh@tuntasinaja.com': 'PahrojiHidayatuloh2698',
  'rizkyfadila@tuntasinaja.com': 'RizkyFadila7351',
  'shifafauziah@tuntasinaja.com': 'ShifaFauziah4829',
  'syifakeisa@tuntasinaja.com': 'SyifaKeisa6384',
  'verlitaazzahra@tuntasinaja.com': 'VerlitaAzzahra8935',
  'zulfaraihana@tuntasinaja.com': 'ZulfaRaihana4761',
  
  // X BC 2
  'angeliabanowati@tuntasinaja.com': 'angeliabanowati67274',
  'apriliatri@tuntasinaja.com': 'apriliatri10575',
  'aureldestiyana@tuntasinaja.com': 'aureldestiyana29137',
  'azrilazka@tuntasinaja.com': 'azrilazka55634',
  'bellafajariah@tuntasinaja.com': 'bellafajariah70212',
  'diahadila@tuntasinaja.com': 'diahadila38003',
  'divaahrun@tuntasinaja.com': 'divaahrun84850',
  'evimulyani@tuntasinaja.com': 'evimulyani42085',
  'farhansaputra@tuntasinaja.com': 'farhansaputra39070',
  'galihanugrah@tuntasinaja.com': 'galihanugrah62415',
  'hafizmaulana@tuntasinaja.com': 'hafizmaulana70843',
  'kailasuci@tuntasinaja.com': 'kailasuci87472',
  'kaylasyauma@tuntasinaja.com': 'kaylasyauma12878',
  'keysaffaanjelita@tuntasinaja.com': 'keysaffaanjelita28675',
  'mariamaria@tuntasinaja.com': 'mariamaria83229',
  'melyracmarynata@tuntasinaja.com': 'melyracmarynata72711',
  'muhammadfachri@tuntasinaja.com': 'muhammadfachri73571',
  'muhammadraffa@tuntasinaja.com': 'muhammadraffa43454',
  'nadinenadine@tuntasinaja.com': 'nadinenadine75812',
  'naylamutia@tuntasinaja.com': 'naylamutia37760',
  'novadiani@tuntasinaja.com': 'novadiani40996',
  'nurazzahra@tuntasinaja.com': 'nurazzahra35279',
  'putrichoirunnisa@tuntasinaja.com': 'putrichoirunnisa61161',
  'rafifahramadhani@tuntasinaja.com': 'rafifahramadhani78144',
  'rajwakhaylila@tuntasinaja.com': 'rajwakhaylila63270',
  'rakabagaskara@tuntasinaja.com': 'rakabagaskara23424',
  'restuoktaviantoro@tuntasinaja.com': 'restuoktaviantoro27239',
  'riskameilani@tuntasinaja.com': 'riskameilani65693',
  'salsabiladina@tuntasinaja.com': 'salsabiladina47416',
  'shafiraaulia@tuntasinaja.com': 'shafiraaulia94841',
  'souluazalita@tuntasinaja.com': 'souluazalita82595',
  'viraaulia@tuntasinaja.com': 'viraaulia74278',
  'zaaraandriani@tuntasinaja.com': 'zaaraandriani35873',
}

async function main() {
  console.log('🚀 Starting password encryption migration...\n')
  
  // Check encryption key
  if (!process.env.PASSWORD_ENCRYPTION_KEY || process.env.PASSWORD_ENCRYPTION_KEY === 'default-key-change-in-production-32-chars!!') {
    console.error('❌ ERROR: PASSWORD_ENCRYPTION_KEY not set or using default value!')
    console.error('   Please set PASSWORD_ENCRYPTION_KEY in your .env file')
    console.error('   Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
    process.exit(1)
  }
  
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  
  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      passwordEncrypted: true,
    },
  })
  
  console.log(`📊 Found ${users.length} users in database\n`)
  
  for (const user of users) {
    try {
      const email = user.email.toLowerCase().trim()
      
      // Skip if already encrypted
      if (user.passwordEncrypted) {
        console.log(`⏭️  Skipped: ${user.name} (${email}) - already encrypted`)
        skippedCount++
        continue
      }
      
      // Get password from map
      const plainPassword = passwordMap[email]
      
      if (!plainPassword) {
        console.log(`⚠️  Warning: ${user.name} (${email}) - password not found in map`)
        errorCount++
        continue
      }
      
      // Encrypt password
      const encryptedPassword = encryptPassword(plainPassword)
      
      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordEncrypted: encryptedPassword,
        },
      })
      
      console.log(`✅ Encrypted: ${user.name} (${email})`)
      successCount++
    } catch (error) {
      console.error(`❌ Error encrypting password for ${user.email}:`, error.message)
      errorCount++
    }
  }
  
  console.log('\n📊 Migration Summary:')
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ⏭️  Skipped: ${skippedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📦 Total: ${users.length}`)
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some passwords were not encrypted. Please check the errors above.')
  } else {
    console.log('\n✅ Migration completed successfully!')
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

