'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { DashboardUser } from '@/lib/dashboard/types'

const UserContext = createContext<DashboardUser | null>(null)

export function DashboardUserProvider({
  user,
  children,
}: {
  user: DashboardUser
  children: ReactNode
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useDashboardUser(): DashboardUser {
  const user = useContext(UserContext)
  if (!user) throw new Error('useDashboardUser must be used inside DashboardUserProvider')
  return user
}
