'use client'

import { trpc } from '@/lib/trpc'

export const useAnnouncementRequests = () => {
  const { data: requests, isLoading, error, refetch } = trpc.announcement.getRequests.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds for new requests
  })

  return {
    requests: requests || [],
    isLoading,
    error,
    refetch,
  }
}

