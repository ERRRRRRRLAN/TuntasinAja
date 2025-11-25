'use client'

import { trpc } from '@/lib/trpc'
import { useSession } from 'next-auth/react'

export const useClassSchedule = (kelas?: string) => {
  const { data: session } = useSession()
  
  const { data: schedule, isLoading, error, refetch } = trpc.schedule.getClassSchedule.useQuery(
    { kelas },
    {
      enabled: !!session,
      refetchOnWindowFocus: true,
    }
  )

  return {
    schedule: schedule || [],
    isLoading,
    error,
    refetch,
  }
}

