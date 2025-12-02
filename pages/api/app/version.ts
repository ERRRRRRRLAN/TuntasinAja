import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

type VersionInfo = {
  versionCode: number
  versionName: string
  downloadUrl: string
  releaseNotes?: string
  forceUpdate: boolean
  updateEnabled: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VersionInfo | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get updateEnabled from database first (priority), fallback to environment variable
  let updateEnabled = true // Default: true
  
  try {
    const updateSetting = await prisma.appSettings.findUnique({
      where: { key: 'updateEnabled' },
    })
    
    if (updateSetting) {
      // Use database setting if exists
      updateEnabled = updateSetting.value === 'true'
    } else {
      // Fallback to environment variable if no database setting
      updateEnabled = process.env.APP_UPDATE_ENABLED !== 'false'
    }
  } catch (error) {
    // If database query fails, fallback to environment variable
    console.error('[version API] Error fetching updateEnabled from database:', error)
    updateEnabled = process.env.APP_UPDATE_ENABLED !== 'false'
  }

  // Get version info from environment variables
  // Set these in Vercel Dashboard → Settings → Environment Variables
  const latestVersion: VersionInfo = {
    versionCode: parseInt(process.env.APP_VERSION_CODE || '1'),
    versionName: process.env.APP_VERSION_NAME || '1.0',
    downloadUrl: process.env.APP_DOWNLOAD_URL || 'https://tuntasinaja-livid.vercel.app/api/app/download',
    releaseNotes: process.env.APP_RELEASE_NOTES || 'Update terbaru dengan perbaikan bug dan fitur baru',
    forceUpdate: process.env.APP_FORCE_UPDATE === 'true',
    updateEnabled, // From database (priority) or environment variable (fallback)
  }

  res.status(200).json(latestVersion)
}

