'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (value: boolean) => void
  pendingNavigation: string | null
  setPendingNavigation: (url: string | null) => void
  onSave: (() => Promise<void>) | null
  setOnSave: (fn: (() => Promise<void>) | null) => void
  onDiscard: (() => void) | null
  setOnDiscard: (fn: (() => void) | null) => void
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType>({
  hasUnsavedChanges: false,
  setHasUnsavedChanges: () => {},
  pendingNavigation: null,
  setPendingNavigation: () => {},
  onSave: null,
  setOnSave: () => {},
  onDiscard: null,
  setOnDiscard: () => {},
})

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [onSave, setOnSave] = useState<(() => Promise<void>) | null>(null)
  const [onDiscard, setOnDiscard] = useState<(() => void) | null>(null)

  return (
    <UnsavedChangesContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        pendingNavigation,
        setPendingNavigation,
        onSave,
        setOnSave: (fn) => setOnSave(() => fn),
        onDiscard,
        setOnDiscard: (fn) => setOnDiscard(() => fn),
      }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  )
}

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext)
}

