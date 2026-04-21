export type ContractStatus =
  | 'draft'
  | 'pending_approval'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'declined'
  | 'expired'

export type SendChannel = 'sms' | 'email'

export type UserRole = 'owner' | 'manager'

export interface DashboardUser {
  id: string
  email: string
  name: string
  role: UserRole
  orgName: string
  createdAt: string
}

export interface Contract {
  id: string
  number: string
  studentName: string
  courseName: string
  amount: number
  status: ContractStatus
  channel: SendChannel
  sentAt: string | null
  createdAt: string
}

export interface DashboardStats {
  total: number
  signed: number
  pending: number
  revenue: number
  deltaTotal: number
  deltaSigned: number
  deltaPending: number
  deltaRevenue: number
}

export interface OnboardingStep {
  id: string
  title: string
  done: boolean
}
