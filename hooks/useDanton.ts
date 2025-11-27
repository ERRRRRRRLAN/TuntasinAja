import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'

export function useDanton() {
  const { data: session } = useSession()
  const { data: dantonData, isLoading, error } = trpc.auth.isDanton.useQuery(undefined, {
    enabled: !!session,
  })

  return {
    isDanton: dantonData?.isDanton || false,
    kelas: dantonData?.kelas || null,
    isLoading,
    error,
  }
}

