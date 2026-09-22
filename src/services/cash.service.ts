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
  CashBalanceSummary,
  CashClosing,
  CashClosingInput,
  CashMovement,
  CashMovementInput,
  CashMovementType,
} from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { auth, db } from '@/services/firebase'
import {
  mapDocId,
  requireNumber,
  requireString,
  toIsoString,
} from '@/services/firestore.mapper'

const COLLECTION = 'cashMovements'
const CASH_CLOSING_PROXY_URL = '/api/cash/closing'

const VALID_TYPES: CashMovementType[] = ['entrada', 'saida']

function isType(value: string): value is CashMovementType {
  return VALID_TYPES.includes(value as CashMovementType)
}

function validateInput(input: CashMovementInput): void {
  if (!isType(input.type)) {
    throw new AppError('validation', 'Tipo de movimentação inválido.')
  }
  if (!input.description.trim()) {
    throw new AppError('validation', 'Descrição é obrigatória.')
  }
  if (!(input.amount > 0)) {
    throw new AppError('validation', 'Informe um valor maior que zero.')
  }
  if (!input.movementDate) {
    throw new AppError('validation', 'Informe a data da movimentação.')
  }
}

function mapMovement(id: string, data: Record<string, unknown>): CashMovement {
  const typeRaw = requireString(data, 'type')
  return {
    id,
    type: isType(typeRaw) ? typeRaw : 'entrada',
    description: requireString(data, 'description'),
    amount: requireNumber(data, 'amount'),
    movementDate: requireString(data, 'movementDate'),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

function mapCashClosing(id: string, data: Record<string, unknown>): CashClosing {
  const status = requireString(data, 'status')
  return {
    id,
    closingDate: requireString(data, 'closingDate'),
    expectedCashAmount: requireNumber(data, 'expectedCashAmount'),
    actualCashAmount: requireNumber(data, 'actualCashAmount'),
    differenceAmount: requireNumber(data, 'differenceAmount'),
    salesTotal: requireNumber(data, 'salesTotal'),
    pixTotal: requireNumber(data, 'pixTotal'),
    creditTotal: requireNumber(data, 'creditTotal'),
    deliveriesCount: requireNumber(data, 'deliveriesCount'),
    notes: requireString(data, 'notes'),
    closedAt: toIsoString(data.closedAt),
    reopenedAt: toIsoString(data.reopenedAt) || null,
    status: status === 'reopened' ? 'reopened' : 'closed',
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

function validateClosingInput(input: CashClosingInput): void {
  if (!input.closingDate) {
    throw new AppError('validation', 'Informe a data do fechamento.')
  }
  if (input.expectedCashAmount < 0 || input.actualCashAmount < 0) {
    throw new AppError('validation', 'Valores de fechamento nao podem ser negativos.')
  }
}

/**
 * Cálculo de saldo centralizado na camada de serviço (regra de negócio).
 * Em produção, espelhar em Cloud Functions para evitar manipulação no cliente.
 */
export function calculateCashBalance(movements: CashMovement[]): CashBalanceSummary {
  let entradas = 0
  let saidas = 0

  for (const movement of movements) {
    if (movement.type === 'entrada') {
      entradas += movement.amount
    } else {
      saidas += movement.amount
    }
  }

  return {
    entradas,
    saidas,
    saldo: entradas - saidas,
    movementsCount: movements.length,
  }
}

export async function listCashMovements(): Promise<CashMovement[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('movementDate', 'desc')),
    )
    return snapshot.docs.map((item) => mapMovement(mapDocId(item), item.data()))
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar as movimentações de caixa.')
  }
}

export async function getCashBalanceSummary(): Promise<CashBalanceSummary> {
  const movements = await listCashMovements()
  return calculateCashBalance(movements)
}

export async function getCashMovementById(id: string): Promise<CashMovement> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) {
      throw new AppError('not_found', 'Movimentação não encontrada.')
    }
    return mapMovement(snapshot.id, snapshot.data())
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar a movimentação.')
  }
}

export async function createCashMovement(
  input: CashMovementInput,
): Promise<string> {
  validateInput(input)

  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      type: input.type,
      description: input.description.trim(),
      amount: input.amount,
      movementDate: input.movementDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw toAppError(error, 'Não foi possível registrar a movimentação.')
  }
}

export async function updateCashMovement(
  id: string,
  input: CashMovementInput,
): Promise<void> {
  validateInput(input)

  try {
    await updateDoc(doc(db, COLLECTION, id), {
      type: input.type,
      description: input.description.trim(),
      amount: input.amount,
      movementDate: input.movementDate,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Não foi possível atualizar a movimentação.')
  }
}

export async function deleteCashMovement(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id))
  } catch (error) {
    throw toAppError(error, 'Não foi possível excluir a movimentação.')
  }
}

export async function getCashClosingByDate(
  closingDate: string,
): Promise<CashClosing | null> {
  if (!closingDate) return null

  try {
    return callCashClosingProxy({ action: 'get', closingDate })
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel carregar o fechamento de caixa.')
  }
}

export async function closeCashDay(input: CashClosingInput): Promise<void> {
  validateClosingInput(input)

  try {
    await callCashClosingProxy({
      action: 'close',
      closingDate: input.closingDate,
      actualCashAmount: input.actualCashAmount,
      notes: input.notes,
    })
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel fechar o caixa.')
  }
}

export async function reopenCashDay(closingDate: string): Promise<void> {
  if (!closingDate) {
    throw new AppError('validation', 'Informe a data do fechamento.')
  }

  try {
    await callCashClosingProxy({ action: 'reopen', closingDate })
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel reabrir o caixa.')
  }
}

async function callCashClosingProxy(body: Record<string, unknown>): Promise<CashClosing | null> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new AppError('auth', 'Usuario nao autenticado para operar fechamento.')
  }

  const idToken = await currentUser.getIdToken()
  const response = await fetch(CASH_CLOSING_PROXY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const raw = (await response.json().catch(() => null)) as
    | (Record<string, unknown> & { message?: string })
    | null

  if (!response.ok) {
    throw new AppError(
      'network',
      raw?.message ?? `Fechamento retornou HTTP ${response.status}.`,
    )
  }
  if (!raw) return null
  return mapCashClosing(String(raw.id ?? raw.closingDate), raw)
}
