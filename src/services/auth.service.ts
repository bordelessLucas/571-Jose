import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import type { UserProfile } from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { auth } from '@/services/firebase'

function mapFirebaseAuthError(error: unknown): AppError {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-email':
        return new AppError(error.code, 'E-mail ou senha inválidos.')
      case 'auth/too-many-requests':
        return new AppError(
          error.code,
          'Muitas tentativas. Aguarde e tente novamente.',
        )
      default:
        break
    }
  }

  return toAppError(error, 'Não foi possível autenticar. Verifique as credenciais.')
}

function mapUser(user: User): UserProfile {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName,
  }
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<UserProfile> {
  const trimmedEmail = email.trim()
  if (!trimmedEmail || !password) {
    throw new AppError('validation', 'Informe e-mail e senha.')
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password)
    return mapUser(credential.user)
  } catch (error) {
    throw mapFirebaseAuthError(error)
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error) {
    throw toAppError(error, 'Não foi possível encerrar a sessão.')
  }
}

export function subscribeToAuthState(
  onChange: (user: UserProfile | null) => void,
): () => void {
  return onAuthStateChanged(auth, (user) => {
    onChange(user ? mapUser(user) : null)
  })
}
