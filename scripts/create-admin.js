#!/usr/bin/env node

/**
 * Script untuk membuat user admin
 * 
 * Usage:
 *   node scripts/create-admin.js
 *   atau
 *   npm run create:admin
 * 
 * Pastikan DATABASE_URL sudah di-set di environment variable atau .env
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  const adminEmail = 'admin@tuntasinaja.com'
  const adminPassword = '210609190210'
  const adminName = 'Admin'

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingAdmin) {
      // Update existing user to admin
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          isAdmin: true,
          passwordHash,
        },
      })
      console.log('\n✅ Admin user sudah ada, berhasil di-update menjadi admin!')
      console.log(`   Email: ${adminEmail}`)
      console.log(`   Password: ${adminPassword}`)
      console.log(`   Name: ${adminName}\n`)
    } else {
      // Create new admin user
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      const admin = await prisma.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          isAdmin: true,
        },
      })

      console.log('\n✅ Admin user berhasil dibuat!')
      console.log(`   ID: ${admin.id}`)
      console.log(`   Email: ${adminEmail}`)
      console.log(`   Password: ${adminPassword}`)
      console.log(`   Name: ${adminName}\n`)
    }
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

