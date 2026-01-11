import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

// Disable body parsing for this endpoint (we're sending binary data)
export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
}

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
      // If file doesn't exist, redirect to external URL or API endpoint
      const externalUrl = process.env.APP_DOWNLOAD_URL || 'https://tuntasinaja-livid.vercel.app/api/app/download'
      console.log('[Download API] File not found, redirecting to:', externalUrl)
      return res.redirect(302, externalUrl)
    }

    // Get file stats
    const fileStats = fs.statSync(apkPath)
    const fileSize = fileStats.size

    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.android.package-archive')
    res.setHeader('Content-Disposition', 'attachment; filename="TuntasinAja.apk"')
    res.setHeader('Content-Length', fileSize)
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // Handle range requests for resumable downloads
    const range = req.headers.range
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunksize = (end - start) + 1
      const file = fs.createReadStream(apkPath, { start, end })

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/vnd.android.package-archive',
      })

      file.pipe(res)
    } else {
      // Stream file for better memory usage with large files
      const file = fs.createReadStream(apkPath)
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="TuntasinAja.apk"',
      })
      file.pipe(res)
    }
  } catch (error) {
    console.error('[Download API] Error serving APK:', error)

    // Fallback: try to redirect to direct public file
    // Use the absolute URL from the request host if possible
    const host = req.headers.host || 'tuntasinaja-livid.vercel.app'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const publicUrl = `${protocol}://${host}/TuntasinAja.apk`

    console.log('[Download API] Error occurred, redirecting to fallback:', publicUrl)
    return res.redirect(302, publicUrl)
  }
}

