import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        try {
          // Normalize email: trim whitespace and convert to lowercase
          const normalizedEmail = credentials.email.trim().toLowerCase()
          
          console.log('[Auth] Login attempt:', {
            originalEmail: credentials.email,
            normalizedEmail: normalizedEmail,
            passwordLength: credentials.password?.length || 0
          })
          
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          })

          if (!user) {
            console.error('[Auth] User not found:', normalizedEmail)
            throw new Error('Invalid email or password')
          }

          console.log('[Auth] User found:', {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin || false,
            passwordHashLength: user.passwordHash?.length || 0,
            passwordHashPrefix: user.passwordHash?.substring(0, 20) || 'N/A'
          })

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          console.log('[Auth] Password validation:', {
            email: normalizedEmail,
            isValid: isValid
          })

          if (!isValid) {
            console.error('[Auth] Invalid password for:', normalizedEmail)
            throw new Error('Invalid email or password')
          }

          console.log('[Auth] Login successful:', {
            id: user.id,
            email: user.email,
            name: user.name
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error('[Auth] Auth error:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          })
          throw error
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // Ensure cookies work correctly
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? undefined : undefined,
      },
    },
  },
}

  export default NextAuth(authOptions)

