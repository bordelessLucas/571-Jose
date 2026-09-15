/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string
  readonly VITE_FOCUS_NFE_MODE: string
  readonly VITE_FOCUS_NFE_ENV: string
  readonly VITE_FOCUS_NFE_TOKEN: string
  readonly VITE_EMITENTE_CNPJ: string
  readonly VITE_EMITENTE_NOME: string
  readonly VITE_EMITENTE_NOME_FANTASIA: string
  readonly VITE_EMITENTE_LOGRADOURO: string
  readonly VITE_EMITENTE_NUMERO: string
  readonly VITE_EMITENTE_BAIRRO: string
  readonly VITE_EMITENTE_MUNICIPIO: string
  readonly VITE_EMITENTE_UF: string
  readonly VITE_EMITENTE_CEP: string
  readonly VITE_EMITENTE_IE: string
  readonly VITE_EMITENTE_REGIME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
