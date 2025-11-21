#!/usr/bin/env node

/**
 * Script untuk verify dan fix admin user
 * 
 * Usage:
 *   node scripts/verify-admin.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function verifyAdmin() {
  const adminEmail = 'admin@tuntasinaja.com'
  const adminPassword = '210609190210'

  try {
    console.log('\n🔍 Checking admin user...\n')

    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (!admin) {
      console.log('❌ Admin user tidak ditemukan!')
      console.log('   Membuat admin user baru...\n')
      
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Admin',
          email: adminEmail,
          passwordHash,
          isAdmin: true,
        },
      })

      console.log('✅ Admin user berhasil dibuat!')
      console.log(`   ID: ${newAdmin.id}`)
      console.log(`   Email: ${newAdmin.email}`)
      console.log(`   Name: ${newAdmin.name}`)
      console.log(`   isAdmin: ${newAdmin.isAdmin || false}\n`)
      
      // Test password
      const testPassword = await bcrypt.compare(adminPassword, newAdmin.passwordHash)
      console.log(`   Password test: ${testPassword ? '✅ Valid' : '❌ Invalid'}\n`)
      return
    }

    console.log('✅ Admin user ditemukan!')
    console.log(`   ID: ${admin.id}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Name: ${admin.name}`)
    console.log(`   isAdmin: ${admin.isAdmin || false}\n`)

    // Test password
    const passwordValid = await bcrypt.compare(adminPassword, admin.passwordHash)
    console.log(`🔐 Password test: ${passwordValid ? '✅ Valid' : '❌ Invalid'}\n`)

    if (!passwordValid) {
      console.log('⚠️  Password tidak valid! Mengupdate password...\n')
      
      const newPasswordHash = await bcrypt.hash(adminPassword, 10)
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          passwordHash: newPasswordHash,
          isAdmin: true, // Ensure isAdmin is true
        },
      })

      console.log('✅ Password berhasil di-update!')
      
      // Test again
      const updatedAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
      })
      if (updatedAdmin) {
        const testAgain = await bcrypt.compare(adminPassword, updatedAdmin.passwordHash)
        console.log(`   Password test setelah update: ${testAgain ? '✅ Valid' : '❌ Invalid'}\n`)
      }
    }

    // Check isAdmin
    const isAdmin = admin.isAdmin
    if (!isAdmin) {
      console.log('⚠️  User belum di-set sebagai admin! Mengupdate...\n')
      
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          isAdmin: true,
        },
      })

      console.log('✅ User berhasil di-set sebagai admin!\n')
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
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAdmin()

