import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import Layout from '@/components/layout/Layout'
import WeeklyScheduleViewer from '@/components/schedule/WeeklyScheduleViewer'

export const dynamic = 'force-dynamic'

export default async function SchedulePage() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      redirect('/auth/signin')
    }

    return (
      <Layout>
      <div className="container">
        <WeeklyScheduleViewer />
      </div>
    </Layout>
    )
  } catch (error: any) {
    // NEXT_REDIRECT is not a real error, it's how Next.js handles redirects
    // Don't log redirect errors
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error // Re-throw redirect to let Next.js handle it
    }
    // Only log actual errors
    console.error('Error getting session:', error)
    redirect('/auth/signin')
  }
}
