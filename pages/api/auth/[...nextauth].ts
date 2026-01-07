import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import logger from '@/lib/logger'

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
          
          logger.debug({ 
            component: 'Auth',
            email: normalizedEmail,
          }, 'Login attempt')
          
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          })

          if (!user) {
            logger.warn({ 
              component: 'Auth',
              email: normalizedEmail,
            }, 'User not found')
            throw new Error('Invalid email or password')
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          if (!isValid) {
            logger.warn({ 
              component: 'Auth',
              email: normalizedEmail,
              userId: user.id,
            }, 'Invalid password')
            throw new Error('Invalid email or password')
          }

          logger.info({ 
            component: 'Auth',
            userId: user.id,
            email: user.email,
            name: user.name,
          }, 'Login successful')

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          logger.error({ 
            component: 'Auth',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          }, 'Auth error')
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

