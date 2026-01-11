import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'

export function useketua() {
  const { data: session } = useSession()
  const { data: ketuaData, isLoading, error } = trpc.auth.isKetua.useQuery(undefined, {
    enabled: !!session,
  })

  return {
    isKetua: ketuaData?.isKetua || false,
    kelas: ketuaData?.kelas || null,
    isLoading,
    error,
  }
}

