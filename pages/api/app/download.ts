import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Try to read APK file from public folder
    const apkPath = path.join(process.cwd(), 'public', 'TuntasinAja.apk')
    
    if (!fs.existsSync(apkPath)) {
      // If file doesn't exist, redirect to external URL
      const externalUrl = process.env.APP_DOWNLOAD_URL || 'https://tuntasinaja.vercel.app/TuntasinAja.apk'
      return res.redirect(302, externalUrl)
    }

    // Read file
    const fileBuffer = fs.readFileSync(apkPath)
    const fileStats = fs.statSync(apkPath)

    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.android.package-archive')
    res.setHeader('Content-Disposition', 'attachment; filename="TuntasinAja.apk"')
    res.setHeader('Content-Length', fileStats.size)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    // Send file
    res.status(200).send(fileBuffer)
  } catch (error) {
    console.error('[Download API] Error serving APK:', error)
    // Fallback to external URL
    const externalUrl = process.env.APP_DOWNLOAD_URL || 'https://tuntasinaja.vercel.app/TuntasinAja.apk'
    res.redirect(302, externalUrl)
  }
}

