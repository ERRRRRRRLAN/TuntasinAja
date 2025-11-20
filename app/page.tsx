import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import FeedPage from '@/components/pages/FeedPage'

export default async function Home() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      redirect('/auth/signin')
    }

    return <FeedPage />
  } catch (error) {
    console.error('Error getting session:', error)
    redirect('/auth/signin')
  }
}

