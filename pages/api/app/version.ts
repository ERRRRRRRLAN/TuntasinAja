import type { NextApiRequest, NextApiResponse } from 'next'

type VersionInfo = {
  versionCode: number
  versionName: string
  downloadUrl: string
  releaseNotes?: string
  forceUpdate: boolean
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
  const latestVersion: VersionInfo = {
    versionCode: parseInt(process.env.APP_VERSION_CODE || '1'),
    versionName: process.env.APP_VERSION_NAME || '1.0',
    downloadUrl: process.env.APP_DOWNLOAD_URL || 'https://tuntasinaja.vercel.app/TuntasinAja.apk',
    releaseNotes: process.env.APP_RELEASE_NOTES || 'Update terbaru dengan perbaikan bug dan fitur baru',
    forceUpdate: process.env.APP_FORCE_UPDATE === 'true',
  }

  res.status(200).json(latestVersion)
}

