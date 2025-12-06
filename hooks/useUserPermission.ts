import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'

export function useUserPermission() {
  const { data: session } = useSession()
  const { data: permissionData, isLoading, error } = trpc.auth.getUserPermission.useQuery(undefined, {
    enabled: !!session,
  })

  const permission = permissionData?.permission || 'read_and_post_edit'
  const canPostEdit = permission === 'read_and_post_edit'
  const isOnlyRead = permission === 'only_read'
  const canCreateAnnouncement = permissionData?.canCreateAnnouncement || false

  return {
    permission,
    canPostEdit,
    isOnlyRead,
    canCreateAnnouncement,
    isLoading,
    error,
  }
}

