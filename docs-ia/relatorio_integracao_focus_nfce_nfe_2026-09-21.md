# Relatorio - integracao fiscal Focus NFe/NFC-e

Data: 2026-09-21

## O que ja existia

- Porta fiscal inicial no frontend.
- Adapter mock e adapter HTTP via Cloud Function.
- Persistencia basica em `fiscalDocuments`.
- Emissao automatica de NF-e ao criar venda.
- Proxy server-side para manter o token Focus fora do frontend.

## O que foi implementado

- Suporte de dominio para `nfe` e `nfce`.
- Status fiscal normalizado para `draft`, `processing`, `authorized`, `rejected`, `cancelled` e `error`.
- Pre-validacao antes da chamada Focus, sem inventar NCM, CFOP, CST/CSOSN ou dados tributarios.
- Bloqueio de emissao duplicada quando ja existe documento fiscal ativo para a venda e tipo.
- Referencia Focus separada por tipo: `sale-nfe-{id}` e `sale-nfce-{id}`.
- Endpoint backend unico `focusFiscal`, exposto em `/api/focus/emit`.
- Roteamento backend para:
  - `POST /v2/nfe?ref={referencia}`
  - `POST /v2/nfce?ref={referencia}`
- Persistencia ampliada de numero, serie, chave, status SEFAZ, protocolo, XML, PDF/DANFE, QR Code, emissao e cancelamento.
- UI no detalhe da venda com acoes para emitir NF-e, emitir NFC-e e reemitir NF-e.
- `.env.example` atualizado com variaveis fiscais sem expor segredo.

## Validacao

- `npm.cmd run build`: OK.
- `npm.cmd run lint`: OK, apenas warnings existentes de React Fast Refresh/setState em effects.
- `npx.cmd tsc --noEmit` em `functions`: OK.
- `npm.cmd run build` em `functions`: bloqueado por `EPERM` ao escrever `functions/lib/index.js`; typecheck sem emissao passou.

## Homologacao Focus

Nao foi disparado teste real contra a Focus neste ambiente porque a Function precisa estar servida/deployada com usuario Firebase autenticado e `FOCUS_NFE_TOKEN` como secret. Nenhum token foi lido, exibido ou registrado.

## Variaveis usadas

- Frontend sem segredo: `VITE_FOCUS_NFE_MODE`, `VITE_FOCUS_NFE_ENV`, `VITE_FOCUS_NFE_PROXY_URL`.
- Mock/config local: `VITE_EMITENTE_*`, `VITE_FOCUS_NFE_SERIE_NFE`, `VITE_FOCUS_NFE_SERIE_NFCE`, `VITE_FOCUS_NFE_CSC_NFCE`, `VITE_FOCUS_NFE_ID_CSC_NFCE`.
- Backend: `FOCUS_NFE_ENV`, `FOCUS_NFE_TOKEN`, `EMITENTE_*`, `FOCUS_NFE_SERIE_NFE`, `FOCUS_NFE_SERIE_NFCE`, `FOCUS_NFE_CSC_NFCE`, `FOCUS_NFE_ID_CSC_NFCE`.

## Dados faltantes para producao

- Certificado A1/configuracao Focus.
- Regime tributario real.
- Serie e numeracao NF-e.
- Serie e numeracao NFC-e.
- CSC e ID CSC para NFC-e.
- Dados fiscais reais por produto: NCM, CFOP, CEST quando aplicavel, origem, CST/CSOSN, ICMS, PIS, COFINS e unidade fiscal.
- Dados fiscais completos da empresa emitente.
- Token/configuracao de producao.

## Passos para liberar producao

1. Preencher dados fiscais reais da empresa e produtos.
2. Configurar secret `FOCUS_NFE_TOKEN` de producao.
3. Configurar certificado/empresa na Focus.
4. Rodar emissao em homologacao com venda realista.
5. Validar retorno, XML, DANFE/cupom e rejeicoes.
6. Trocar `FOCUS_NFE_ENV=producao` por configuracao.
