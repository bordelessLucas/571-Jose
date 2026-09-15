import {
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'

export function toIsoString(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  if (typeof value === 'string' && value.length > 0) {
    return value
  }

  return new Date(0).toISOString()
}

export function requireString(data: DocumentData, key: string): string {
  const value = data[key]
  return typeof value === 'string' ? value : ''
}

export function requireNumber(data: DocumentData, key: string): number {
  const value = data[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function requireBoolean(data: DocumentData, key: string, fallback = true): boolean {
  const value = data[key]
  return typeof value === 'boolean' ? value : fallback
}

export function mapDocId(snapshot: QueryDocumentSnapshot<DocumentData>): string {
  return snapshot.id
}
