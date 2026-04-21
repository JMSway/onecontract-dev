export type UserRole = 'owner' | 'manager'

export type ContractStatus =
  | 'draft'
  | 'pending_approval'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'declined'
  | 'expired'

export type SignMethod = 'sms_otp' | 'egov_qr'
export type SendChannel = 'sms' | 'email'

export interface Organization {
  id: string
  name: string
  bin?: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
  created_at: string
}

export interface User {
  id: string
  org_id: string
  email: string
  full_name?: string
  role: UserRole
  needs_approval: boolean
  avatar_url?: string
  created_at: string
}

export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'iin' | 'phone' | 'email'
  required: boolean
  filled_by?: 'manager' | 'client'
  placeholder?: string
}

export interface Template {
  id: string
  org_id: string
  name: string
  description?: string
  fields: TemplateField[]
  source_file_url?: string
  template_docx_url?: string
  created_by?: string
  created_at: string
}

export interface DocxPatch {
  search: string
  replace: string
}

export interface Contract {
  id: string
  org_id: string
  template_id?: string
  data: Record<string, string>
  pdf_url?: string
  pdf_hash?: string
  status: ContractStatus
  sent_via?: SendChannel
  recipient_name?: string
  recipient_phone?: string
  recipient_email?: string
  created_by?: string
  approved_by?: string
  created_at: string
  sent_at?: string
  viewed_at?: string
  signed_at?: string
  expires_at?: string
  retention_until?: string
}

export interface AuditLog {
  id: string
  contract_id: string
  action: string
  actor?: string
  ip?: string
  ua?: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface DashboardStats {
  total: number
  signed: number
  pending: number
  revenue: number
}

export interface CurrentUserWithOrg extends User {
  organizations: Organization | null
}
