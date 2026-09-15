import { todayInputValue } from '@/lib/format'

export function isOverdue(dueDate: string, status: string): boolean {
  return status === 'pendente' && dueDate < todayInputValue()
}
