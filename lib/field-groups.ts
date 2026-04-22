export const GROUP_CONFIG: Record<string, { label: string; color: string }> = {
  customer: { label: 'Данные заказчика', color: '#0F52BA' },
  student: { label: 'Данные ученика', color: '#0F7B55' },
  contract: { label: 'Условия договора', color: '#7C3AED' },
  payment: { label: 'Оплата', color: '#D97706' },
  other: { label: 'Прочее', color: '#6B7280' },
}

export const GROUP_HIGHLIGHT_COLORS: Record<string, { bg: string; border: string }> = {
  customer: { bg: '#DBEAFE', border: '#3B82F6' },
  student: { bg: '#D1FAE5', border: '#10B981' },
  contract: { bg: '#EDE9FE', border: '#8B5CF6' },
  payment: { bg: '#FEF3C7', border: '#F59E0B' },
  other: { bg: '#F3F4F6', border: '#9CA3AF' },
}

export const GROUP_ORDER = ['customer', 'student', 'contract', 'payment', 'other']
