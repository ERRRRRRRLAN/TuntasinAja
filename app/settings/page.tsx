import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { redirect } from 'next/navigation'
import SettingsPage from '@/components/settings/SettingsPage'

export const dynamic = 'force-dynamic'

export default async function Settings() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return <SettingsPage />
}

