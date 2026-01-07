#!/usr/bin/env node

/**
 * Script untuk fix admin password - Generate hash baru dan update langsung ke database
 * 
 * Usage:
 *   node scripts/fix-admin-password.js
 * 
 * Pastikan DATABASE_URL sudah di-set di environment variable atau .env
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function fixAdminPassword() {
  const adminEmail = 'admin@tuntasinaja.com'
  const adminPassword = '210609190210'
  
  try {
    console.log('\n🔧 Fixing admin password...\n')
    
    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('❌ ERROR: DATABASE_URL environment variable tidak ditemukan!')
      console.error('   Set DATABASE_URL terlebih dahulu:')
      console.error('   $env:DATABASE_URL="postgresql://..."')
      process.exit(1)
    }
    
    console.log('🔍 Checking admin user...')
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (!existingUser) {
      console.log('❌ Admin user tidak ditemukan!')
      console.log('   Membuat admin user baru...\n')
      
      // Generate hash baru
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      console.log('Generated password hash:', passwordHash)
      
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Admin',
          email: adminEmail,
          passwordHash,
          isAdmin: true
        }
      })
      
      console.log('✅ Admin user berhasil dibuat!')
      console.log(`   ID: ${newAdmin.id}`)
      console.log(`   Email: ${newAdmin.email}`)
      console.log(`   isAdmin: ${newAdmin.isAdmin}\n`)
      
      // Test password
      const testPassword = await bcrypt.compare(adminPassword, newAdmin.passwordHash)
      console.log(`   Password test: ${testPassword ? '✅ Valid' : '❌ Invalid'}\n`)
      
      if (!testPassword) {
        console.error('❌ ERROR: Password test gagal setelah create!')
        process.exit(1)
      }
      
    } else {
      console.log('✅ Admin user ditemukan!')
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   Name: ${existingUser.name}`)
      console.log(`   isAdmin: ${existingUser.isAdmin || false}`)
      console.log(`   Current hash prefix: ${existingUser.passwordHash.substring(0, 29)}...\n`)
      
      // Test current password
      const currentPasswordValid = await bcrypt.compare(adminPassword, existingUser.passwordHash)
      console.log(`🔐 Current password test: ${currentPasswordValid ? '✅ Valid' : '❌ Invalid'}\n`)
      
      if (!currentPasswordValid) {
        console.log('⚠️  Password tidak valid, menggenerate hash baru...\n')
        
        // Generate hash baru
        const newPasswordHash = await bcrypt.hash(adminPassword, 10)
        console.log('Generated new password hash:', newPasswordHash)
        
        // Update password
        await prisma.user.update({
          where: { email: adminEmail },
          data: {
            passwordHash: newPasswordHash,
            isAdmin: true
          }
        })
        
        console.log('✅ Password hash berhasil di-update!')
        
        // Verify password
        const verifyUser = await prisma.user.findUnique({
          where: { email: adminEmail }
        })
        
        const isValid = await bcrypt.compare(adminPassword, verifyUser.passwordHash)
        console.log(`   Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`)
        console.log(`   isAdmin: ${verifyUser.isAdmin ? '✅ True' : '❌ False'}\n`)
        
        if (!isValid) {
          console.error('❌ ERROR: Password verification gagal setelah update!')
          process.exit(1)
        }
      } else {
        console.log('✅ Password sudah valid, tidak perlu di-update!')
        
        // Ensure isAdmin = true
        if (!existingUser.isAdmin) {
          console.log('⚠️  isAdmin = false, updating...')
          await prisma.user.update({
            where: { email: adminEmail },
            data: { isAdmin: true }
          })
          console.log('✅ isAdmin berhasil di-set ke true!\n')
        }
      }
    }
    
    console.log('✅ Admin user siap digunakan!')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}\n`)
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    const errorMessage = (error && error.message) ? error.message : (error ? error.toString() : '')
    
    if (errorMessage.includes('Unknown column') || errorMessage.includes('isAdmin') || errorMessage.includes('is_admin')) {
      console.error('\n⚠️  ERROR: Kolom isAdmin belum ada di database!')
      console.error('   Jalankan: npx prisma db push')
      console.error('   Atau tambahkan kolom is_admin dengan SQL:\n')
      console.error('   ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;\n')
    } else if (errorMessage.includes('connect') || errorMessage.includes('DATABASE_URL')) {
      console.error('\n⚠️  ERROR: Tidak bisa connect ke database!')
      console.error('   Pastikan DATABASE_URL sudah di-set dengan benar')
      console.error('   Contoh: $env:DATABASE_URL="postgresql://..."\n')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminPassword()

