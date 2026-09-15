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
import type {
  AccountPayable,
  AccountPayableInput,
  FinancialStatus,
} from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { db } from '@/services/firebase'
import {
  mapDocId,
  requireNumber,
  requireString,
  toIsoString,
} from '@/services/firestore.mapper'

const COLLECTION = 'accountsPayable'

const VALID_STATUS: FinancialStatus[] = ['pendente', 'pago', 'cancelado']

function isStatus(value: string): value is FinancialStatus {
  return VALID_STATUS.includes(value as FinancialStatus)
}

function validateInput(input: AccountPayableInput): void {
  if (!input.description.trim()) {
    throw new AppError('validation', 'Descrição é obrigatória.')
  }
  if (!(input.amount > 0)) {
    throw new AppError('validation', 'Informe um valor maior que zero.')
  }
  if (!input.dueDate) {
    throw new AppError('validation', 'Informe o vencimento.')
  }
  if (!isStatus(input.status)) {
    throw new AppError('validation', 'Status inválido.')
  }
}

function mapAccount(id: string, data: Record<string, unknown>): AccountPayable {
  const statusRaw = requireString(data, 'status')
  return {
    id,
    description: requireString(data, 'description'),
    amount: requireNumber(data, 'amount'),
    dueDate: requireString(data, 'dueDate'),
    status: isStatus(statusRaw) ? statusRaw : 'pendente',
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

export async function listAccountsPayable(): Promise<AccountPayable[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('dueDate', 'asc')),
    )
    return snapshot.docs.map((item) => mapAccount(mapDocId(item), item.data()))
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar as contas a pagar.')
  }
}

export async function getAccountPayableById(id: string): Promise<AccountPayable> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) {
      throw new AppError('not_found', 'Conta a pagar não encontrada.')
    }
    return mapAccount(snapshot.id, snapshot.data())
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar a conta a pagar.')
  }
}

export async function createAccountPayable(
  input: AccountPayableInput,
): Promise<string> {
  validateInput(input)

  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      description: input.description.trim(),
      amount: input.amount,
      dueDate: input.dueDate,
      status: input.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw toAppError(error, 'Não foi possível criar a conta a pagar.')
  }
}

export async function updateAccountPayable(
  id: string,
  input: AccountPayableInput,
): Promise<void> {
  validateInput(input)

  try {
    await updateDoc(doc(db, COLLECTION, id), {
      description: input.description.trim(),
      amount: input.amount,
      dueDate: input.dueDate,
      status: input.status,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Não foi possível atualizar a conta a pagar.')
  }
}

export async function deleteAccountPayable(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id))
  } catch (error) {
    throw toAppError(error, 'Não foi possível excluir a conta a pagar.')
  }
}
