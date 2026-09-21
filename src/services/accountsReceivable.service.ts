import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type {
  AccountReceivable,
  AccountReceivableInput,
  FinancialStatus,
  ReceivablePaymentInput,
} from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { db } from '@/services/firebase'
import {
  mapDocId,
  requireNumber,
  requireString,
  toIsoString,
} from '@/services/firestore.mapper'

const COLLECTION = 'accountsReceivable'

const VALID_STATUS: FinancialStatus[] = ['pendente', 'pago', 'cancelado']

function isStatus(value: string): value is FinancialStatus {
  return VALID_STATUS.includes(value as FinancialStatus)
}

function validateInput(input: AccountReceivableInput): void {
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

function mapAccount(
  id: string,
  data: Record<string, unknown>,
): AccountReceivable {
  const statusRaw = requireString(data, 'status')
  return {
    id,
    description: requireString(data, 'description'),
    amount: requireNumber(data, 'amount'),
    originalAmount: requireNumber(data, 'originalAmount') || requireNumber(data, 'amount'),
    balance: requireNumber(data, 'balance') || (statusRaw === 'pago' ? 0 : requireNumber(data, 'amount')),
    discountAmount: requireNumber(data, 'discountAmount'),
    paidAmount: requireNumber(data, 'paidAmount'),
    finalAmount: requireNumber(data, 'finalAmount') || requireNumber(data, 'amount'),
    discountReason: requireString(data, 'discountReason'),
    discountedBy: requireString(data, 'discountedBy') || null,
    paidAt: toIsoString(data.paidAt) || null,
    dueDate: requireString(data, 'dueDate'),
    status: isStatus(statusRaw) ? statusRaw : 'pendente',
    clientId: requireString(data, 'clientId'),
    clientName: requireString(data, 'clientName'),
    saleId: requireString(data, 'saleId') || null,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

export async function listAccountsReceivable(): Promise<AccountReceivable[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('dueDate', 'asc')),
    )
    return snapshot.docs.map((item) => mapAccount(mapDocId(item), item.data()))
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar as contas a receber.')
  }
}

export async function listAccountsReceivableByClientId(
  clientId: string,
): Promise<AccountReceivable[]> {
  if (!clientId) return []

  try {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION),
        where('clientId', '==', clientId),
        orderBy('dueDate', 'asc'),
      ),
    )
    return snapshot.docs.map((item) => mapAccount(mapDocId(item), item.data()))
  } catch (error) {
    // Fallback sem índice composto: filtra em memória.
    try {
      const all = await listAccountsReceivable()
      return all
        .filter((item) => item.clientId === clientId)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    } catch {
      throw toAppError(
        error,
        'Não foi possível carregar os débitos do cliente.',
      )
    }
  }
}

export async function findAccountReceivableBySaleId(
  saleId: string,
): Promise<AccountReceivable | null> {
  if (!saleId) return null

  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), where('saleId', '==', saleId)),
    )
    const first = snapshot.docs[0]
    return first ? mapAccount(first.id, first.data()) : null
  } catch (error) {
    throw toAppError(error, 'Não foi possível localizar a conta da venda.')
  }
}

export async function getAccountReceivableById(
  id: string,
): Promise<AccountReceivable> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) {
      throw new AppError('not_found', 'Conta a receber não encontrada.')
    }
    return mapAccount(snapshot.id, snapshot.data())
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar a conta a receber.')
  }
}

export async function createAccountReceivable(
  input: AccountReceivableInput,
): Promise<string> {
  validateInput(input)

  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      description: input.description.trim(),
      amount: input.amount,
      originalAmount: input.amount,
      balance: input.status === 'pago' ? 0 : input.amount,
      discountAmount: 0,
      paidAmount: input.status === 'pago' ? input.amount : 0,
      finalAmount: input.amount,
      discountReason: '',
      discountedBy: null,
      paidAt: input.status === 'pago' ? new Date().toISOString() : null,
      dueDate: input.dueDate,
      status: input.status,
      clientId: input.clientId.trim(),
      clientName: input.clientName.trim(),
      saleId: input.saleId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw toAppError(error, 'Não foi possível criar a conta a receber.')
  }
}

export async function updateAccountReceivable(
  id: string,
  input: AccountReceivableInput,
): Promise<void> {
  validateInput(input)

  try {
    await updateDoc(doc(db, COLLECTION, id), {
      description: input.description.trim(),
      amount: input.amount,
      originalAmount: input.amount,
      balance: input.status === 'pago' ? 0 : input.amount,
      dueDate: input.dueDate,
      status: input.status,
      clientId: input.clientId.trim(),
      clientName: input.clientName.trim(),
      saleId: input.saleId,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Não foi possível atualizar a conta a receber.')
  }
}

export async function payAccountReceivable(
  id: string,
  input: ReceivablePaymentInput,
): Promise<void> {
  if (input.discountAmount < 0 || input.paidAmount <= 0) {
    throw new AppError('validation', 'Informe pagamento e desconto validos.')
  }

  try {
    const accountRef = doc(db, COLLECTION, id)
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(accountRef)
      if (!snapshot.exists()) {
        throw new AppError('not_found', 'Conta a receber nao encontrada.')
      }

      const account = mapAccount(snapshot.id, snapshot.data())
      if (account.status !== 'pendente') {
        throw new AppError('validation', 'Conta ja esta baixada ou cancelada.')
      }

      const finalAmount = Math.max(account.originalAmount - input.discountAmount, 0)
      if (input.paidAmount < finalAmount) {
        throw new AppError(
          'validation',
          'Valor recebido menor que saldo final apos desconto.',
        )
      }
      if (input.discountAmount > 0 && !input.discountReason.trim()) {
        throw new AppError('validation', 'Informe o motivo do desconto.')
      }

      transaction.update(accountRef, {
        originalAmount: account.originalAmount,
        balance: 0,
        discountAmount: input.discountAmount,
        paidAmount: input.paidAmount,
        finalAmount,
        discountReason: input.discountReason.trim(),
        discountedBy: input.paidBy ?? null,
        paidAt: new Date().toISOString(),
        status: 'pago',
        updatedAt: serverTimestamp(),
      })
    })
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel baixar a conta a receber.')
  }
}

export async function deleteAccountReceivable(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id))
  } catch (error) {
    throw toAppError(error, 'Não foi possível excluir a conta a receber.')
  }
}
