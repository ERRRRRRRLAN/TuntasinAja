'use client'

import { trpc } from '@/lib/trpc'

export const useSchedule = (kelas?: string) => {
  const { data: schedules, isLoading, error, refetch } = trpc.schedule.getByKelas.useQuery(
    { kelas },
    {
      enabled: !!kelas,
      refetchOnWindowFocus: true,
    }
  )

  return {
    schedules: schedules || [],
    isLoading,
    error,
    refetch,
  }
}

export const useMySchedule = () => {
  const { data: schedules, isLoading, error, refetch } = trpc.schedule.getMySchedule.useQuery(undefined, {
    refetchOnWindowFocus: true,
  })

  return {
    schedules: schedules || [],
    isLoading,
    error,
    refetch,
  }
}

