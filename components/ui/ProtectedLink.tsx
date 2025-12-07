'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUnsavedChanges } from '@/components/providers/UnsavedChangesProvider'
import ConfirmDialog from './ConfirmDialog'

interface ProtectedLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  [key: string]: any
}

export default function ProtectedLink({ 
  href, 
  children, 
  className, 
  style,
  onClick,
  ...props 
}: ProtectedLinkProps) {
  const router = useRouter()
  const { hasUnsavedChanges, onSave, onDiscard, setPendingNavigation } = useUnsavedChanges()
  const [showDialog, setShowDialog] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    // Only block if there are unsaved changes AND callbacks are available
    if (hasUnsavedChanges && (onSave || onDiscard)) {
      e.preventDefault()
      setShowDialog(true)
      setPendingNavigation(href)
    } else {
      onClick?.()
    }
  }

  const handleConfirm = async () => {
    setShowDialog(false)
    if (onSave) {
      try {
        await onSave()
        setPendingNavigation(null)
        router.push(href)
      } catch (error) {
        console.error('Error saving:', error)
      }
    } else {
      router.push(href)
    }
  }

  const handleDiscard = () => {
    setShowDialog(false)
    if (onDiscard) {
      onDiscard()
    }
    setPendingNavigation(null)
    router.push(href)
  }

  return (
    <>
      <Link
        href={href}
        className={className}
        style={style}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Link>
      {showDialog && (
        <ConfirmDialog
          title="Perubahan Belum Disimpan"
          message="Anda memiliki perubahan yang belum disimpan. Apakah Anda ingin menyimpan perubahan terlebih dahulu?"
          confirmText="Simpan & Lanjutkan"
          cancelText="Buang & Lanjutkan"
          onConfirm={handleConfirm}
          onCancel={handleDiscard}
          danger={false}
        />
      )}
    </>
  )
}

