import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// This API route can be called by Vercel Cron Jobs or external cron services
// Auto-deletes announcements that have passed their expiresAt date
// Runs once daily at 1:00 AM (due to Vercel Hobby plan limitation - only daily cron jobs)
// To set up Vercel Cron, add this to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/auto-delete-expired-announcements",
//     "schedule": "0 1 * * *" // Once daily at 1:00 AM
//   }]
// }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Optional: Add authentication/authorization
  // For Vercel Cron, you can check the Authorization header
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { getUTCDate } = await import('@/lib/date-utils')
    const now = getUTCDate()

    // Find all announcements that have expired
    const expiredAnnouncements = await (prisma as any).announcement.findMany({
      where: {
        expiresAt: {
          lte: now, // expiresAt <= now
        },
      },
      select: {
        id: true,
        title: true,
        kelas: true,
        expiresAt: true,
      },
    })

    if (expiredAnnouncements.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No expired announcements found',
        deletedCount: 0,
      })
    }

    // Delete expired announcements
    const deleteResult = await (prisma as any).announcement.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    })

    console.log(`[Cron] Auto-deleted ${deleteResult.count} expired announcements`)

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} expired announcements`,
      deletedCount: deleteResult.count,
      deletedAnnouncements: expiredAnnouncements.map((a: any) => ({
        id: a.id,
        title: a.title,
        kelas: a.kelas,
        expiresAt: a.expiresAt,
      })),
    })
  } catch (error: any) {
    console.error('[Cron] Error auto-deleting expired announcements:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Failed to delete expired announcements',
    })
  }
}

