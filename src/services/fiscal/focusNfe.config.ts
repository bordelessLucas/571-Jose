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
  regimeTributario: '1' | '2' | '3' | ''
  serieNfe: string
  proximoNumeroNfe: string
  serieNfce: string
  proximoNumeroNfce: string
  cscNfce: string
  idCscNfce: string
}

function readEnv(key: keyof ImportMetaEnv, fallback = ''): string {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

export function getFocusNfeProxyUrl(): string {
  return readEnv('VITE_FOCUS_NFE_PROXY_URL', '/api/focus')
}

export function getFocusNfeMode(): FiscalProviderMode {
  return 'live'
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
  const regime = readEnv('VITE_EMITENTE_REGIME')

  return {
    cnpj: readEnv('VITE_EMITENTE_CNPJ'),
    nome: readEnv('VITE_EMITENTE_NOME'),
    nomeFantasia: readEnv('VITE_EMITENTE_NOME_FANTASIA'),
    logradouro: readEnv('VITE_EMITENTE_LOGRADOURO'),
    numero: readEnv('VITE_EMITENTE_NUMERO'),
    bairro: readEnv('VITE_EMITENTE_BAIRRO'),
    municipio: readEnv('VITE_EMITENTE_MUNICIPIO'),
    uf: readEnv('VITE_EMITENTE_UF'),
    cep: readEnv('VITE_EMITENTE_CEP'),
    inscricaoEstadual: readEnv('VITE_EMITENTE_IE'),
    regimeTributario:
      regime === '1' || regime === '2' || regime === '3' ? regime : '',
    serieNfe: readEnv('VITE_FOCUS_NFE_SERIE_NFE'),
    proximoNumeroNfe: readEnv('VITE_FOCUS_NFE_PROXIMO_NUMERO_NFE'),
    serieNfce: readEnv('VITE_FOCUS_NFE_SERIE_NFCE'),
    proximoNumeroNfce: readEnv('VITE_FOCUS_NFE_PROXIMO_NUMERO_NFCE'),
    cscNfce: readEnv('VITE_FOCUS_NFE_CSC_NFCE'),
    idCscNfce: readEnv('VITE_FOCUS_NFE_ID_CSC_NFCE'),
  }
}
