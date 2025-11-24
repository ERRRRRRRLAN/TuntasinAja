const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('📝 Creating notifications table...')
  
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-notifications-table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Execute SQL
    await prisma.$executeRawUnsafe(sql)
    
    console.log('✅ Notifications table created successfully!')
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Notifications table already exists, skipping...')
    } else {
      console.error('❌ Error creating notifications table:', error)
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

