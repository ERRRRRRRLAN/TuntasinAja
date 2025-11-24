const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('📝 Adding fcm_token column to users table...')
  
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'add-fcm-token-column.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Execute SQL
    await prisma.$executeRawUnsafe(sql)
    
    console.log('✅ fcm_token column added successfully!')
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('ℹ️  fcm_token column already exists, skipping...')
    } else {
      console.error('❌ Error adding fcm_token column:', error)
      throw error
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

