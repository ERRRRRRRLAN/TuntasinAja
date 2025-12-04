'use client'

import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'

export const useClassSubscription = (kelas?: string) => {
  const { data: session } = useSession()
  
  const { data, isLoading, error, refetch } = trpc.subscription.getClassSubscription.useQuery(
    { kelas },
    {
      enabled: !!session?.user,
      refetchOnWindowFocus: true,
      refetchInterval: (query) => {
        // Stop polling jika tab tidak aktif (hidden)
        if (typeof document !== 'undefined' && document.hidden) {
          return false
        }
        // 60 detik untuk subscription status (tidak perlu terlalu sering)
        return 60000
      },
    }
  )

  return {
    subscription: data || null,
    isActive: data?.isActive || false,
    isExpired: data?.isExpired || false,
    isExpiringSoon: data?.isExpiringSoon || false,
    daysRemaining: data?.daysRemaining || null,
    hoursRemaining: data?.hoursRemaining || null,
    status: data?.status || 'no_subscription',
    endDate: data?.subscriptionEndDate ? new Date(data.subscriptionEndDate) : null,
    isLoading,
    error,
    refetch,
  }
}

