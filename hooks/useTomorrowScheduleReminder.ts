'use client'

import { trpc } from '@/lib/trpc'
import { useSession } from 'next-auth/react'

export const useTomorrowScheduleReminder = () => {
  const { data: session, status } = useSession()
  
  const { data, isLoading, error, refetch } = trpc.schedule.getTomorrowScheduleReminder.useQuery(
    undefined,
    {
      enabled: status === 'authenticated',
      refetchOnWindowFocus: true,
      refetchInterval: 60000, // Refetch every minute
    }
  )

  return {
    hasSchedule: data?.hasSchedule || false,
    subjects: data?.subjects || [],
    tasks: data?.tasks || [],
    tomorrowDate: data?.tomorrowDate ? new Date(data.tomorrowDate) : null,
    isLoading,
    error,
    refetch,
  }
}

