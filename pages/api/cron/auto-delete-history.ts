import type { NextApiRequest, NextApiResponse } from 'next'
import { autoDeleteHistory } from '@/server/cron/autoDeleteHistory'

/**
 * API endpoint for auto-delete history cron job
 * Should be called by external cron service (e.g., Vercel Cron, GitHub Actions, etc.)
 * 
 * Security: Add authentication token check in production
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Authentication token check
  // For Vercel Cron, you can check the Authorization header
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const result = await autoDeleteHistory()
    return res.status(200).json(result)
  } catch (error) {
    console.error('[AutoDeleteHistory API] Error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

