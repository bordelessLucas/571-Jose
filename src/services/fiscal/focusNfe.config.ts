import type { FiscalProviderMode } from '@/domain/types'

export type FocusNfeEnvironment = 'homologacao' | 'producao'

export type EmitenteConfig = {
  cnpj: string
  nome: string
  nomeFantasia: string
  logradouro: string
  numero: string
  bairro: string
  municipio: string
  uf: string
  cep: string
  inscricaoEstadual: string
  regimeTributario: '1' | '2' | '3'
}

function readEnv(key: keyof ImportMetaEnv, fallback = ''): string {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

/**
 * Token Focus NFe.
 * Em modo live no browser o ideal é proxy (Cloud Functions) — token não deve
 * ficar só no frontend em produção. O template permite testar o adapter.
 */
export function getFocusNfeToken(): string {
  return readEnv('VITE_FOCUS_NFE_TOKEN', 'FOCUS_NFE_TOKEN_TEMPLATE_REPLACE_ME')
}

export function getFocusNfeMode(): FiscalProviderMode {
  const mode = readEnv('VITE_FOCUS_NFE_MODE', 'mock').toLowerCase()
  return mode === 'live' ? 'live' : 'mock'
}

export function getFocusNfeEnvironment(): FocusNfeEnvironment {
  const env = readEnv('VITE_FOCUS_NFE_ENV', 'homologacao').toLowerCase()
  return env === 'producao' ? 'producao' : 'homologacao'
}

export function getFocusNfeBaseUrl(): string {
  return getFocusNfeEnvironment() === 'producao'
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br'
}

export function getEmitenteConfig(): EmitenteConfig {
  return {
    cnpj: readEnv('VITE_EMITENTE_CNPJ', '00000000000000'),
    nome: readEnv('VITE_EMITENTE_NOME', 'EMPRESA EMITENTE TEMPLATE LTDA'),
    nomeFantasia: readEnv('VITE_EMITENTE_NOME_FANTASIA', 'José Gestão'),
    logradouro: readEnv('VITE_EMITENTE_LOGRADOURO', 'Rua Exemplo'),
    numero: readEnv('VITE_EMITENTE_NUMERO', '100'),
    bairro: readEnv('VITE_EMITENTE_BAIRRO', 'Centro'),
    municipio: readEnv('VITE_EMITENTE_MUNICIPIO', 'São Paulo'),
    uf: readEnv('VITE_EMITENTE_UF', 'SP'),
    cep: readEnv('VITE_EMITENTE_CEP', '01001000'),
    inscricaoEstadual: readEnv('VITE_EMITENTE_IE', 'ISENTO'),
    regimeTributario: (readEnv('VITE_EMITENTE_REGIME', '1') as '1' | '2' | '3') || '1',
  }
}

export function isFocusTokenTemplate(token: string): boolean {
  return (
    !token ||
    token.includes('TEMPLATE') ||
    token === 'FOCUS_NFE_TOKEN_TEMPLATE_REPLACE_ME'
  )
}
