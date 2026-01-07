import type { NextApiRequest, NextApiResponse } from 'next'
import { readFileSync } from 'fs'
import { join } from 'path'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const manifestPath = join(process.cwd(), 'public', 'manifest.json')
    const manifestContent = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)

    res.setHeader('Content-Type', 'application/manifest+json')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return res.status(200).json(manifest)
  } catch (error) {
    console.error('Error reading manifest.json:', error)
    return res.status(500).json({ error: 'Failed to load manifest' })
  }
}

