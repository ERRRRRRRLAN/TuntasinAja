// Force remove thread unique constraint - more aggressive approach
// This script will try to find and remove ANY constraint involving judul_mapel and date
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function forceRemove() {
  try {
    console.log('🔍 Searching for all constraints on threads table...\n')

    // Get ALL constraints (not just unique)
    const allConstraints = await prisma.$queryRaw`
      SELECT 
        con.conname as constraint_name,
        con.contype as constraint_type,
        CASE con.contype
          WHEN 'u' THEN 'UNIQUE'
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'f' THEN 'FOREIGN KEY'
          WHEN 'c' THEN 'CHECK'
          ELSE 'OTHER'
        END as constraint_type_name,
        pg_get_constraintdef(con.oid) as definition,
        array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as columns
      FROM pg_constraint con
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
      WHERE con.conrelid = 'threads'::regclass
      GROUP BY con.conname, con.contype, con.oid
      ORDER BY con.conname
    `

    console.log('📋 All constraints on threads table:')
    console.log(JSON.stringify(allConstraints, null, 2))
    console.log('\n')

    // Find constraints involving judul_mapel and date
    const targetConstraints = allConstraints.filter(constraint => {
      const columns = constraint.columns || []
      const definition = (constraint.definition || '').toLowerCase()
      const hasJudulMapel = columns.includes('judul_mapel') || definition.includes('judul_mapel')
      const hasDate = columns.includes('date') || definition.includes('"date"') || definition.includes(' date')
      return hasJudulMapel && hasDate
    })

    if (targetConstraints.length === 0) {
      console.log('⚠️  No constraint found involving both judul_mapel and date')
      console.log('   This might mean:')
      console.log('   1. Constraint already removed')
      console.log('   2. Constraint has different column names')
      console.log('   3. Constraint is in a different database')
      console.log('\n   Please check the output above for any constraint that might be related.')
    } else {
      console.log(`🎯 Found ${targetConstraints.length} constraint(s) to remove:\n`)
      
      for (const constraint of targetConstraints) {
        console.log(`   - ${constraint.constraint_name} (${constraint.constraint_type_name})`)
        console.log(`     Columns: ${constraint.columns.join(', ')}`)
        console.log(`     Definition: ${constraint.definition}\n`)
      }

      // Try to drop each constraint
      for (const constraint of targetConstraints) {
        const constraintName = constraint.constraint_name
        console.log(`🗑️  Attempting to drop: ${constraintName}`)
        
        try {
          await prisma.$executeRawUnsafe(
            `ALTER TABLE threads DROP CONSTRAINT IF EXISTS ${constraintName}`
          )
          console.log(`   ✅ Successfully dropped: ${constraintName}\n`)
        } catch (error) {
          console.error(`   ❌ Error dropping ${constraintName}:`, error.message)
          console.log(`   💡 Try running this SQL manually in Supabase:`)
          console.log(`      ALTER TABLE threads DROP CONSTRAINT ${constraintName};\n`)
        }
      }
    }

    // Also try dropping by common names (just in case)
    console.log('\n🔄 Trying common constraint names...')
    const commonNames = [
      'threads_judul_mapel_date_key',
      'threads_title_date_key',
      'threads_judul_mapel_date_unique',
      'threads_judul_mapel_date_idx',
      'threads_judul_mapel_date',
    ]

    for (const name of commonNames) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE threads DROP CONSTRAINT IF EXISTS ${name}`
        )
        console.log(`   ✅ Attempted: ${name}`)
      } catch (error) {
        // Ignore
      }
    }

    // Final verification
    console.log('\n🔍 Final verification...')
    const remaining = await prisma.$queryRaw`
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

    const stillHas = remaining.some(c => {
      const cols = c.columns || []
      const def = (c.definition || '').toLowerCase()
      return (cols.includes('judul_mapel') || def.includes('judul_mapel')) &&
             (cols.includes('date') || def.includes('"date"') || def.includes(' date'))
    })

    if (!stillHas) {
      console.log('✅ SUCCESS: No constraint found involving (judul_mapel, date)')
    } else {
      console.log('⚠️  WARNING: Constraint might still exist. Please check manually.')
      console.log('   Remaining unique constraints:')
      console.log(JSON.stringify(remaining, null, 2))
    }

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

forceRemove()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error:', error)
    process.exit(1)
  })

