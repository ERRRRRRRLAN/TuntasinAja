// Migration script: Add denormalization fields to histories table
// Run with: node scripts/migrate-history-denormalization.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrate() {
  try {
    console.log('🚀 Starting migration...')

    // Check if columns already exist by trying to query them
    try {
      await prisma.$queryRaw`
        SELECT thread_title, thread_author_id, thread_author_name 
        FROM histories 
        LIMIT 1
      `
      console.log('✅ Columns already exist, skipping creation...')
    } catch (error) {
      console.log('📝 Creating new columns...')
      
      // Add new columns
      await prisma.$executeRaw`
        ALTER TABLE histories 
        ADD COLUMN IF NOT EXISTS thread_title TEXT,
        ADD COLUMN IF NOT EXISTS thread_author_id TEXT,
        ADD COLUMN IF NOT EXISTS thread_author_name TEXT
      `
      console.log('✅ Columns created successfully')
    }

    // Update existing histories with denormalized data
    console.log('🔄 Updating existing histories with denormalized data...')
    
    const result = await prisma.$executeRaw`
      UPDATE histories h
      SET 
        thread_title = t.judul_mapel,
        thread_author_id = t.user_id_pembuat,
        thread_author_name = u.name
      FROM threads t
      JOIN users u ON t.user_id_pembuat = u.id
      WHERE h.thread_id = t.id
        AND (h.thread_title IS NULL OR h.thread_author_id IS NULL OR h.thread_author_name IS NULL)
    `
    
    console.log(`✅ Updated ${result} history records`)

    // Make thread_id nullable (if needed)
    try {
      await prisma.$executeRaw`
        ALTER TABLE histories 
        ALTER COLUMN thread_id DROP NOT NULL
      `
      console.log('✅ Made thread_id nullable')
    } catch (error) {
      console.log('ℹ️  thread_id is already nullable or constraint does not exist')
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

