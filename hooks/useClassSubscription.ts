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
      refetchInterval: 60000, // Refetch every minute to update remaining time
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

