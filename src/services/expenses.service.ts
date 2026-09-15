import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import type { Expense, ExpenseCategory, ExpenseInput } from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { db } from '@/services/firebase'
import {
  mapDocId,
  requireNumber,
  requireString,
  toIsoString,
} from '@/services/firestore.mapper'

const COLLECTION = 'expenses'

const VALID_CATEGORIES: ExpenseCategory[] = [
  'operacional',
  'administrativa',
  'comercial',
  'financeira',
  'outra',
]

function isExpenseCategory(value: string): value is ExpenseCategory {
  return VALID_CATEGORIES.includes(value as ExpenseCategory)
}

function validateInput(input: ExpenseInput): void {
  if (!input.description.trim()) {
    throw new AppError('validation', 'Descrição da despesa é obrigatória.')
  }
  if (!isExpenseCategory(input.category)) {
    throw new AppError('validation', 'Categoria inválida.')
  }
  if (!(input.amount > 0)) {
    throw new AppError('validation', 'Informe um valor maior que zero.')
  }
  if (!input.expenseDate) {
    throw new AppError('validation', 'Informe a data da despesa.')
  }
}

function mapExpense(id: string, data: Record<string, unknown>): Expense {
  const categoryRaw = requireString(data, 'category')
  const category: ExpenseCategory = isExpenseCategory(categoryRaw)
    ? categoryRaw
    : 'outra'

  return {
    id,
    description: requireString(data, 'description'),
    category,
    amount: requireNumber(data, 'amount'),
    expenseDate: requireString(data, 'expenseDate'),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

export async function listExpenses(): Promise<Expense[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('expenseDate', 'desc')),
    )
    return snapshot.docs.map((item) => mapExpense(mapDocId(item), item.data()))
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar as despesas.')
  }
}

export async function getExpenseById(id: string): Promise<Expense> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) {
      throw new AppError('not_found', 'Despesa não encontrada.')
    }
    return mapExpense(snapshot.id, snapshot.data())
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar a despesa.')
  }
}

export async function createExpense(input: ExpenseInput): Promise<string> {
  validateInput(input)

  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      description: input.description.trim(),
      category: input.category,
      amount: input.amount,
      expenseDate: input.expenseDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw toAppError(error, 'Não foi possível registrar a despesa.')
  }
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<void> {
  validateInput(input)

  try {
    await updateDoc(doc(db, COLLECTION, id), {
      description: input.description.trim(),
      category: input.category,
      amount: input.amount,
      expenseDate: input.expenseDate,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Não foi possível atualizar a despesa.')
  }
}

export async function deleteExpense(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id))
  } catch (error) {
    throw toAppError(error, 'Não foi possível excluir a despesa.')
  }
}
