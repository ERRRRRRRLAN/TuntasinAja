// Quick script to check and remove thread constraints
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAndRemove() {
  try {
    // Check all unique constraints
    const constraints = await prisma.$queryRaw`
      SELECT 
        con.conname as constraint_name,
        pg_get_constraintdef(con.oid) as definition
      FROM pg_constraint con
      WHERE con.conrelid = 'threads'::regclass
        AND con.contype = 'u'
    `
    
    console.log('📋 All unique constraints on threads:')
    console.log(JSON.stringify(constraints, null, 2))
    
    // Try to find the specific constraint
    for (const constraint of constraints) {
      const def = constraint.definition
      if (def.includes('judul_mapel') && def.includes('date')) {
        console.log(`\n🗑️  Found constraint to remove: ${constraint.constraint_name}`)
        await prisma.$executeRawUnsafe(
          `ALTER TABLE threads DROP CONSTRAINT IF EXISTS ${constraint.constraint_name}`
        )
        console.log(`✅ Dropped: ${constraint.constraint_name}`)
      }
    }
    
    // Verify
    const remaining = await prisma.$queryRaw`
      SELECT 
        con.conname as constraint_name,
        pg_get_constraintdef(con.oid) as definition
      FROM pg_constraint con
      WHERE con.conrelid = 'threads'::regclass
        AND con.contype = 'u'
    `
    
    console.log('\n📋 Remaining unique constraints:')
    console.log(JSON.stringify(remaining, null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndRemove()

