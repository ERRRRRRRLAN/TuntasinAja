import type { NextApiRequest, NextApiResponse } from 'next'

type VersionInfo = {
  versionCode: number
  versionName: string
  downloadUrl: string
  releaseNotes?: string
  forceUpdate: boolean
  updateEnabled: boolean
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<VersionInfo | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get version info from environment variables
  // Set these in Vercel Dashboard → Settings → Environment Variables
  // APP_UPDATE_ENABLED: Set to 'false' to disable update notifications (default: 'true')
  const latestVersion: VersionInfo = {
    versionCode: parseInt(process.env.APP_VERSION_CODE || '1'),
    versionName: process.env.APP_VERSION_NAME || '1.0',
    downloadUrl: process.env.APP_DOWNLOAD_URL || 'https://tuntasinaja-livid.vercel.app/api/app/download',
    releaseNotes: process.env.APP_RELEASE_NOTES || 'Update terbaru dengan perbaikan bug dan fitur baru',
    forceUpdate: process.env.APP_FORCE_UPDATE === 'true',
    updateEnabled: process.env.APP_UPDATE_ENABLED !== 'false', // Default: true, set to 'false' to disable
  }

  res.status(200).json(latestVersion)
}

