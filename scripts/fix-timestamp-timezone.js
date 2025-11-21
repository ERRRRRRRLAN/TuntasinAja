// Script Node.js untuk memperbaiki timezone dan timestamp di database
// Jalankan dengan: node scripts/fix-timestamp-timezone.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixTimezone() {
  try {
    console.log('🔍 Memeriksa timezone database...')
    
    // Periksa waktu server saat ini
    const serverTime = await prisma.$queryRaw`SELECT NOW() as server_time, CURRENT_TIMESTAMP as current_timestamp`
    console.log('⏰ Waktu server database:', serverTime[0])
    
    // Periksa timezone
    const timezone = await prisma.$queryRaw`SHOW timezone`
    console.log('🌍 Timezone database:', timezone[0])
    
    // Set timezone ke Asia/Jakarta (WIB)
    console.log('\n🔧 Mengatur timezone ke Asia/Jakarta...')
    await prisma.$executeRaw`SET timezone = 'Asia/Jakarta'`
    
    // Verifikasi
    const newTimezone = await prisma.$queryRaw`SHOW timezone`
    console.log('✅ Timezone baru:', newTimezone[0])
    
    const newTime = await prisma.$queryRaw`SELECT NOW() as server_time, CURRENT_TIMESTAMP as current_timestamp`
    console.log('⏰ Waktu server setelah update:', newTime[0])
    
    console.log('\n✅ Timezone berhasil diatur!')
    console.log('\n⚠️  CATATAN:')
    console.log('1. Timezone ini hanya berlaku untuk session saat ini')
    console.log('2. Untuk set permanen, gunakan script SQL di Supabase SQL Editor')
    console.log('3. Atau tambahkan timezone di DATABASE_URL connection string:')
    console.log('   ?options=-c%20timezone%3DAsia/Jakarta')
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Fungsi untuk update timestamp yang sudah ada (HATI-HATI!)
async function updateExistingTimestamps() {
  try {
    console.log('\n⚠️  PERINGATAN: Script ini akan mengubah semua timestamp yang sudah ada!')
    console.log('Pastikan Anda sudah backup database terlebih dahulu!')
    console.log('Untuk menjalankan update, uncomment kode di bawah ini\n')
    
    // UNCOMMENT KODE DI BAWAH INI JIKA ANDA YAKIN INGIN UPDATE TIMESTAMP YANG SUDAH ADA
    /*
    console.log('🔄 Memperbarui timestamp di users...')
    const usersUpdated = await prisma.$executeRaw`
      UPDATE users 
      SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta',
          updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
      WHERE created_at IS NOT NULL
    `
    console.log(`✅ Updated ${usersUpdated} users`)
    
    console.log('🔄 Memperbarui timestamp di threads...')
    const threadsUpdated = await prisma.$executeRaw`
      UPDATE threads 
      SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta',
          date = date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta',
          updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
      WHERE created_at IS NOT NULL
    `
    console.log(`✅ Updated ${threadsUpdated} threads`)
    
    console.log('🔄 Memperbarui timestamp di comments...')
    const commentsUpdated = await prisma.$executeRaw`
      UPDATE comments 
      SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta',
          updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
      WHERE created_at IS NOT NULL
    `
    console.log(`✅ Updated ${commentsUpdated} comments`)
    
    console.log('🔄 Memperbarui timestamp di user_statuses...')
    const statusesUpdated = await prisma.$executeRaw`
      UPDATE user_statuses 
      SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta',
          updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
      WHERE created_at IS NOT NULL
    `
    console.log(`✅ Updated ${statusesUpdated} user_statuses`)
    
    console.log('🔄 Memperbarui timestamp di histories...')
    const historiesUpdated = await prisma.$executeRaw`
      UPDATE histories 
      SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta',
          tanggal_selesai = tanggal_selesai AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
      WHERE created_at IS NOT NULL
    `
    console.log(`✅ Updated ${historiesUpdated} histories`)
    
    console.log('\n✅ Semua timestamp berhasil diperbarui!')
    */
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--update-timestamps')) {
    await updateExistingTimestamps()
  } else {
    await fixTimezone()
  }
}

main()
  .catch((error) => {
    console.error('❌ Script gagal:', error)
    process.exit(1)
  })

