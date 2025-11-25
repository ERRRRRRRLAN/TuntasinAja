'use client'

import { trpc } from '@/lib/trpc'

export const useAnnouncements = () => {
  const { data: announcements, isLoading, error, refetch } = trpc.announcement.getAll.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refetch every minute to update expired announcements
  })

  return {
    announcements: announcements || [],
    isLoading,
    error,
    refetch,
  }
}

