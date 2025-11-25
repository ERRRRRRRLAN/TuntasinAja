#!/usr/bin/env node

/**
 * Script untuk set subscription X BC 2
 * 
 * Usage:
 *   node scripts/set-x-bc-2-subscription.js [days]
 * 
 * Default: 365 hari (1 tahun)
 * 
 * Pastikan DATABASE_URL sudah di-set di environment variable atau .env
 */

const { PrismaClient } = require('@prisma/client')
const { addDays } = require('date-fns')

const prisma = new PrismaClient()

async function main() {
  const kelas = 'X BC 2'
  const days = process.argv[2] ? parseInt(process.argv[2]) : 365 // Default 1 tahun
  
  console.log(`🚀 Setting subscription for ${kelas}...\n`)
  console.log(`   Duration: ${days} days\n`)

  try {
    const now = new Date() // Current UTC time
    const endDate = addDays(now, days)

    // Check if subscription already exists
    const existing = await prisma.classSubscription.findUnique({
      where: { kelas },
    })

    if (existing) {
      // Update existing subscription
      await prisma.classSubscription.update({
        where: { kelas },
        data: {
          subscriptionEndDate: endDate,
          updatedAt: now,
        },
      })
      console.log(`✅ Subscription updated for ${kelas}`)
      console.log(`   End Date: ${endDate.toISOString()}`)
      console.log(`   End Date (Local): ${endDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`)
    } else {
      // Create new subscription
      await prisma.classSubscription.create({
        data: {
          kelas,
          subscriptionEndDate: endDate,
        },
      })
      console.log(`✅ Subscription created for ${kelas}`)
      console.log(`   End Date: ${endDate.toISOString()}`)
      console.log(`   End Date (Local): ${endDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`)
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Kelas: ${kelas}`)
    console.log(`   Duration: ${days} days`)
    console.log(`   End Date: ${endDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'short' })}`)
  } catch (error) {
    console.error(`❌ Error setting subscription:`, error.message)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

