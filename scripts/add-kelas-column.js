// Migration script: Add kelas column to users table
// Run with: node scripts/add-kelas-column.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrate() {
  try {
    console.log('🚀 Starting migration: Add kelas column to users table...')

    // Check if column already exists
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name = 'kelas'
      `
      
      if (result && result.length > 0) {
        console.log('✅ Column "kelas" already exists, skipping creation...')
      } else {
        throw new Error('Column does not exist')
      }
    } catch (error) {
      console.log('📝 Creating kelas column...')
      
      // Add kelas column
      await prisma.$executeRaw`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS kelas VARCHAR(50) NULL
      `
      console.log('✅ Column "kelas" created successfully')
    }

    // Add comment to column
    try {
      await prisma.$executeRaw`
        COMMENT ON COLUMN users.kelas IS 'Kelas siswa (format: X RPL 1, XI TKJ 2, dll). NULL untuk admin atau user tanpa kelas.'
      `
      console.log('✅ Added comment to column')
    } catch (error) {
      console.log('ℹ️  Could not add comment (might already exist or not supported)')
    }

    // Create index for faster filtering
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_users_kelas ON users(kelas) WHERE kelas IS NOT NULL
      `
      console.log('✅ Created index on kelas column')
    } catch (error) {
      console.log('ℹ️  Index might already exist')
    }

    // Verify the column was added
    const verify = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name = 'kelas'
    `
    
    if (verify && verify.length > 0) {
      console.log('✅ Verification successful:')
      console.log(JSON.stringify(verify[0], null, 2))
    } else {
      console.warn('⚠️  Warning: Could not verify column creation')
    }

    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrate()
  .then(() => {
    console.log('🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error:', error)
    process.exit(1)
  })

