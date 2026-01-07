// Migration script: Remove unique constraint on threads (title, date)
// Run with: node scripts/remove-thread-unique-constraint.js
//
// This allows users from different classes to create threads with the same
// title and date. Duplicate prevention is now handled by application logic
// that checks the author's kelas.

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrate() {
  try {
    console.log('🚀 Starting migration: Remove unique constraint on threads (title, date)...')

    // Find the constraint name
    const constraints = await prisma.$queryRaw`
      SELECT 
        conname as constraint_name
      FROM pg_constraint
      WHERE conrelid = 'threads'::regclass
        AND contype = 'u'
        AND array_length(conkey, 1) = 2
    `

    console.log('📋 Found constraints:', constraints)

    // Get all unique constraints first
    const allConstraints = await prisma.$queryRaw`
      SELECT 
        con.conname as constraint_name,
        pg_get_constraintdef(con.oid) as definition,
        array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as columns
      FROM pg_constraint con
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
      WHERE con.conrelid = 'threads'::regclass
        AND con.contype = 'u'
      GROUP BY con.conname, con.oid
    `

    console.log('📋 All unique constraints on threads:')
    console.log(JSON.stringify(allConstraints, null, 2))

    // Find and drop constraint that includes both judul_mapel and date
    let dropped = false
    for (const constraint of allConstraints) {
      const columns = constraint.columns
      const definition = constraint.definition
      
      // Check if this constraint involves both judul_mapel and date
      if (columns && columns.length === 2) {
        const hasJudulMapel = columns.includes('judul_mapel') || definition.includes('judul_mapel')
        const hasDate = columns.includes('date') || definition.includes('date')
        
        if (hasJudulMapel && hasDate) {
          const constraintName = constraint.constraint_name
          console.log(`📝 Dropping constraint: ${constraintName}`)
          console.log(`   Definition: ${definition}`)
          
          try {
            await prisma.$executeRawUnsafe(
              `ALTER TABLE threads DROP CONSTRAINT IF EXISTS ${constraintName}`
            )
            console.log(`✅ Constraint "${constraintName}" dropped successfully`)
            dropped = true
          } catch (error) {
            console.error(`❌ Error dropping constraint ${constraintName}:`, error.message)
          }
        }
      }
    }

    // Also try common constraint names as fallback
    const possibleNames = [
      'threads_judul_mapel_date_key',
      'threads_title_date_key',
      'threads_judul_mapel_date_unique',
      'threads_judul_mapel_date_idx',
    ]

    for (const name of possibleNames) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE threads DROP CONSTRAINT IF EXISTS ${name}`
        )
        console.log(`✅ Attempted to drop constraint: ${name}`)
        dropped = true
      } catch (error) {
        // Ignore errors for non-existent constraints
      }
    }

    // Verify constraint was removed
    const remainingConstraints = await prisma.$queryRaw`
      SELECT 
        con.conname as constraint_name,
        pg_get_constraintdef(con.oid) as definition,
        array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as columns
      FROM pg_constraint con
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
      WHERE con.conrelid = 'threads'::regclass
        AND con.contype = 'u'
      GROUP BY con.conname, con.oid
    `

    console.log('\n📋 Remaining unique constraints after removal:')
    console.log(JSON.stringify(remainingConstraints, null, 2))

    // Check if any remaining constraint still has both judul_mapel and date
    const stillHasConstraint = remainingConstraints.some(constraint => {
      const columns = constraint.columns || []
      const definition = constraint.definition || ''
      const hasJudulMapel = columns.includes('judul_mapel') || definition.includes('judul_mapel')
      const hasDate = columns.includes('date') || definition.includes('date')
      return hasJudulMapel && hasDate
    })

    if (!stillHasConstraint) {
      console.log('✅ Verification successful: Unique constraint (title, date) has been removed')
    } else {
      console.warn('⚠️  Warning: Constraint involving (judul_mapel, date) might still exist')
      console.warn('   You may need to manually remove it using SQL Editor in Supabase')
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

