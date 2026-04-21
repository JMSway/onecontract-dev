import { createClient } from './supabase'
import type {
  Contract,
  CurrentUserWithOrg,
  DashboardStats,
  Template,
} from './types'

const _cache = new Map<string, { data: unknown; exp: number }>()

function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = _cache.get(key)
  if (hit && Date.now() < hit.exp) return Promise.resolve(hit.data as T)
  return fn().then((data) => {
    _cache.set(key, { data, exp: Date.now() + ttl * 1000 })
    return data
  })
}

export async function getCurrentUser(): Promise<CurrentUserWithOrg | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data as CurrentUserWithOrg
}

async function _getContracts(orgId: string): Promise<Contract[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Contract[]
}

export function getContracts(orgId: string): Promise<Contract[]> {
  return cached(`contracts:${orgId}`, 60, () => _getContracts(orgId))
}

export async function getTemplates(orgId: string): Promise<Template[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Template[]
}

async function _getDashboardStats(orgId: string): Promise<DashboardStats> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contracts')
    .select('status, data')
    .eq('org_id', orgId)

  if (error) throw error
  const contracts = data ?? []

  return {
    total: contracts.length,
    signed: contracts.filter((c) => c.status === 'signed').length,
    pending: contracts.filter((c) =>
      ['sent', 'viewed', 'pending_approval'].includes(c.status as string)
    ).length,
    revenue: contracts
      .filter((c) => c.status === 'signed')
      .reduce((sum, c) => {
        const raw = (c.data as Record<string, unknown> | null)?.amount
        const amount = typeof raw === 'number' ? raw : Number(raw ?? 0)
        return sum + (Number.isFinite(amount) ? amount : 0)
      }, 0),
  }
}

export function getDashboardStats(orgId: string): Promise<DashboardStats> {
  return cached(`stats:${orgId}`, 60, () => _getDashboardStats(orgId))
}
