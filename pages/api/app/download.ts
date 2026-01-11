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
    // Determine path to APK file
    // On Vercel, the file might be in a different location relative to the function
    const publicPath = path.join(process.cwd(), 'public')
    const apkPath = path.join(publicPath, 'TuntasinAja.apk')

    console.log('[Download API] Searching for file at:', apkPath)

    if (!fs.existsSync(apkPath)) {
      // If file doesn't exist, log it and try to redirect to the static file as a last resort
      // BUT avoid redirecting to /api/app/download which would loop
      console.error('[Download API] File not found at:', apkPath)

      const host = req.headers.host || 'tuntasinaja-livid.vercel.app'
      const protocol = host.includes('localhost') ? 'http' : 'https'

      // If we are already the download API, don't redirect back to ourselves
      // If APP_DOWNLOAD_URL is set, use it. Otherwise, return 404.
      if (process.env.APP_DOWNLOAD_URL && !process.env.APP_DOWNLOAD_URL.includes('/api/app/download')) {
        return res.redirect(302, process.env.APP_DOWNLOAD_URL)
      }

      // Fallback to static URL but only if it's not the same as the current request
      const staticUrl = `${protocol}://${host}/TuntasinAja.apk`
      console.log('[Download API] Redirecting to static fallback:', staticUrl)
      return res.redirect(302, staticUrl)
    }

    // Get file stats
    const fileStats = fs.statSync(apkPath)
    const fileSize = fileStats.size

    // Set standard headers for download
    res.setHeader('Content-Type', 'application/vnd.android.package-archive')
    res.setHeader('Content-Disposition', 'attachment; filename="TuntasinAja.apk"')
    res.setHeader('Content-Length', fileSize)
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // Handle range requests for resumable downloads
    const range = req.headers.range
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunksize = (end - start) + 1

      res.status(206)
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
      res.setHeader('Content-Length', chunksize)

      const file = fs.createReadStream(apkPath, { start, end })
      file.pipe(res)
    } else {
      // Stream file for better memory usage
      const file = fs.createReadStream(apkPath)
      res.status(200)
      file.pipe(res)
    }
  } catch (error) {
    console.error('[Download API] Fatal error serving APK:', error)
    return res.status(500).json({ error: 'Internal server error while serving APK' })
  }
}

