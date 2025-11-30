#!/usr/bin/env node

/**
 * Script untuk fix admin user - Update password dan ensure isAdmin = true
 * 
 * Usage:
 *   node scripts/fix-admin.js
 * 
 * Pastikan DATABASE_URL sudah di-set di environment variable atau .env
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function fixAdmin() {
  const adminEmail = 'admin@tuntasinaja.com'
  const adminPassword = '210609190210'
  
  try {
    console.log('\n🔧 Fixing admin user...\n')
    
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
    
    if (existingUser) {
      console.log('✅ Admin user ditemukan!')
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   Name: ${existingUser.name}`)
      console.log(`   isAdmin: ${existingUser.isAdmin || false}\n`)
      
      // Check if password is valid
      const passwordValid = await bcrypt.compare(adminPassword, existingUser.passwordHash)
      console.log(`🔐 Password test: ${passwordValid ? '✅ Valid' : '❌ Invalid'}\n`)
      
      if (!passwordValid || !existingUser.isAdmin) {
        console.log('⚠️  Updating admin user...')
        
        // Generate hash baru
        const passwordHash = await bcrypt.hash(adminPassword, 10)
        
        // Update password and ensure isAdmin = true
        await prisma.user.update({
          where: { email: adminEmail },
          data: {
            passwordHash,
            isAdmin: true
          }
        })
        
        console.log('✅ Admin user updated!')
        
        // Verify password
        const verifyUser = await prisma.user.findUnique({
          where: { email: adminEmail }
        })
        
        const isValid = await bcrypt.compare(adminPassword, verifyUser.passwordHash)
        console.log(`   Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`)
        console.log(`   isAdmin: ${verifyUser.isAdmin ? '✅ True' : '❌ False'}\n`)
      } else {
        console.log('✅ Admin user sudah benar, tidak perlu di-update!\n')
      }
      
    } else {
      console.log('📝 Admin user tidak ditemukan, membuat baru...\n')
      
      // Generate hash baru
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      
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
      console.log(`   Name: ${newAdmin.name}`)
      console.log(`   isAdmin: ${newAdmin.isAdmin}\n`)
      
      // Test password
      const testPassword = await bcrypt.compare(adminPassword, newAdmin.passwordHash)
      console.log(`   Password test: ${testPassword ? '✅ Valid' : '❌ Invalid'}\n`)
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

fixAdmin()