import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../[...nextauth]'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session to verify user is logged in
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      // Already logged out
      return res.status(200).json({ success: true, message: 'Already logged out' })
    }

    // Clear the session cookie by setting it to expire
    const cookieName = process.env.NODE_ENV === 'production'
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token'

    // Set cookie to expire immediately
    res.setHeader('Set-Cookie', [
      `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
      // Also try to clear CSRF token
      `next-auth.csrf-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
      // Clear callback URL cookie
      `next-auth.callback-url=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    ])

    return res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully',
      redirectUrl: '/auth/signin'
    })
  } catch (error) {
    console.error('Logout API error:', error)
    return res.status(500).json({ error: 'Failed to logout' })
  }
}

