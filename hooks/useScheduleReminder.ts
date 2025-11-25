'use client'

import { trpc } from '@/lib/trpc'

export const useScheduleReminder = () => {
  const { data, isLoading, error } = trpc.schedule.getReminderTasks.useQuery(undefined, {
    refetchOnWindowFocus: true,
    staleTime: 60000, // Cache for 1 minute
  })

  return {
    tasks: data?.tasks || [],
    subjects: data?.subjects || [],
    tomorrow: data?.tomorrow || '',
    hasReminder: (data?.tasks || []).length > 0 && (data?.subjects || []).length > 0,
    isLoading,
    error,
  }
}

