export class AppError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

export function toAppError(error: unknown, fallbackMessage: string): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error && error.message) {
    return new AppError('unknown', error.message)
  }

  return new AppError('unknown', fallbackMessage)
}
