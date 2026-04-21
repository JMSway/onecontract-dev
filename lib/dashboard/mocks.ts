import type { Contract, DashboardStats, DashboardUser, OnboardingStep } from './types'

export const mockUser: DashboardUser = {
  id: 'mock-user-1',
  email: 'damir@school.kz',
  name: 'Дамир',
  role: 'owner',
  orgName: 'Almaty English School',
  createdAt: new Date().toISOString(),
}

export const mockStats: DashboardStats = {
  total: 0,
  signed: 0,
  pending: 0,
  revenue: 0,
  deltaTotal: 0,
  deltaSigned: 0,
  deltaPending: 0,
  deltaRevenue: 0,
}

export const mockContracts: Contract[] = []

export const mockOnboarding: OnboardingStep[] = [
  { id: 'account', title: 'Создан аккаунт', done: true },
  { id: 'template', title: 'Загрузить первый шаблон', done: false },
  { id: 'contract', title: 'Создать первый договор', done: false },
  { id: 'signature', title: 'Получить первую подпись', done: false },
  { id: 'team', title: 'Пригласить менеджера', done: false },
]

export function formatTenge(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₸'
}

export function greetingByHour(hour: number): string {
  if (hour < 5) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}
