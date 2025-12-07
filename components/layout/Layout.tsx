'use client'

import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import BottomNavigation from './BottomNavigation'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <BottomNavigation />
    </>
  )
}

