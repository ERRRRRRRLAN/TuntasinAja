'use client'

import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'

export const useScheduleReminder = () => {
  const { data: session } = useSession()
  
  const { data, isLoading, error } = trpc.schedule.getReminderTasks.useQuery(undefined, {
    enabled: !!session, // Only fetch when user is logged in
    refetchOnWindowFocus: true,
    staleTime: 60000, // Cache for 1 minute
  })

  const tasks = data?.tasks || []
  const subjects = data?.subjects || []
  const hasReminder = tasks.length > 0 && subjects.length > 0

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[useScheduleReminder]', {
      hasSession: !!session,
      tasksCount: tasks.length,
      subjectsCount: subjects.length,
      hasReminder,
      tomorrow: data?.tomorrow,
      isLoading,
      error: error?.message,
      data,
    })
  }

  return {
    tasks,
    subjects,
    tomorrow: data?.tomorrow || null,
    hasReminder,
    isLoading,
    error,
  }
}

