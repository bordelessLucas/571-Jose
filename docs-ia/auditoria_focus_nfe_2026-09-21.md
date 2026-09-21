# AUDITORIA FOCUS NFE

## 1. O que ja estava correto

- Token Focus ficava no backend via secret `FOCUS_NFE_TOKEN`.
- Frontend usava proxy autenticado em vez de chamar a Focus diretamente.
- Existia camada fiscal isolada com adapter mock/live.
- Venda ja gravava vinculo fiscal basico em `fiscalDocuments`.
- Build/lint estavam operacionais.

## 2. Problemas encontrados

- Backend aceitava payload fiscal vindo do browser. Causa: Function usava corpo enviado pelo frontend. Impacto: cliente poderia manipular valor, produto, documento ou dados fiscais.
- Idempotencia era apenas local/frontend. Causa: checagem em Firestore antes da Function, sem lock server-side. Impacto: clique duplo/retry poderia duplicar emissao.
- Produto tinha defaults fiscais ficticios (`CFOP`, origem, CST/CSOSN). Causa: mapper/form preenchiam fallback. Impacto: risco de enviar tributacao inventada.
- Consulta, cancelamento, XML e DANFE existiam de forma parcial. Causa: sem chamadas completas no adapter/UI. Impacto: documento podia ficar sem sincronizacao apos processamento.
- NFC-e nao tinha todos campos auxiliares preparados no cadastro do produto. Causa: modelo sem CEST/PIS/COFINS. Impacto: dados reais futuros nao tinham destino claro.

## 3. Correcoes realizadas

- Function agora recebe apenas `saleId`, tipo, acao e justificativa quando necessario.
- Backend busca venda, cliente e produto no Firestore Admin antes de montar payload Focus.
- Criado lock server-side em `fiscalEmissionLocks` por referencia Focus.
- `fiscalEmissionLocks` bloqueado nas regras do Firestore para clientes.
- Removidos defaults fiscais ficticios do estoque e do payload.
- Adicionados CEST, PIS e COFINS no modelo/cadastro de produto.
- Adicionados fluxos de consultar situacao e cancelar documento.
- UI mostra links de XML e DANFE/cupom quando a Focus retornar URLs.
- Proxy Focus suporta emissao, consulta e cancelamento para NF-e/NFC-e.

## 4. NF-e

Status: PARCIAL

Motivo: emissao, consulta, cancelamento, persistencia, XML/DANFE e idempotencia tecnica estao implementados. Validacao real com SEFAZ homologacao depende de Function em execucao/deploy, secret Focus, dados fiscais reais e usuario autenticado.

## 5. NFC-e

Status: PARCIAL

Motivo: emissao e consulta/cancelamento usam `/v2/nfce`. QR Code, XML e cupom sao persistidos quando retornados. Producao ainda depende de CSC/ID CSC e dados fiscais reais.

## 6. Testes realizados

- `npm.cmd run build`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit` em `functions`

Resultado: build e typecheck OK. Lint OK com warnings React ja existentes ou de baixo impacto.

## 7. Testes reais em homologacao

- Requisicao realizada: nenhuma chamada real enviada.
- Resultado: bloqueado pelo ambiente local sem Function servida/deployada com autenticacao Firebase.
- Status: BLOQUEADO por ambiente, nao por codigo.
- Retorno relevante: nao houve retorno Focus. Nenhum token foi exibido.

## 8. Dados que ainda faltam para producao

- Certificado A1/configuracao Focus.
- Regime tributario confirmado.
- Serie e numeracao NF-e.
- Serie e numeracao NFC-e.
- CSC e ID CSC.
- NCM, CFOP, CST/CSOSN, CEST, ICMS, PIS, COFINS e unidade fiscal reais por produto.
- Dados completos e reais da empresa emitente.
- Token/configuracao de producao.

## 9. O que sera necessario fazer quando esses dados chegarem

- Preencher dados fiscais da empresa/produtos.
- Configurar secret `FOCUS_NFE_TOKEN` correto por ambiente.
- Deployar Functions e Hosting com `/api/focus/emit`.
- Rodar NF-e e NFC-e em homologacao.
- Validar autorizacao/rejeicao, consulta, XML, DANFE/cupom e cancelamento.
- Alterar `FOCUS_NFE_ENV` para producao apenas apos aceite.

## 10. Arquivos principais alterados

- `functions/src/index.ts` - proxy fiscal seguro, fonte de verdade no backend, consulta, cancelamento e lock.
- `src/services/fiscal/*` - adapters, validacao, mapper e contrato fiscal.
- `src/services/sales.service.ts` - venda para documento fiscal, consulta/cancelamento e persistencia.
- `src/services/fiscalDocuments.service.ts` - metadados completos do documento.
- `src/services/inventory.service.ts` e `InventoryFormPage.tsx` - campos fiscais sem defaults ficticios.
- `SaleDetailPage.tsx` - acoes fiscais e links XML/DANFE.
- `firestore.rules` - bloqueio de locks fiscais client-side.
- `.env.example` e `firebase.json` - configuracao fiscal e rewrite.

## 11. Pendencias reais

- Dados fiscais reais do cliente/empresa/produtos.
- Certificado A1 e configuracao Focus.
- CSC/ID CSC para NFC-e.
- Execucao real em homologacao com Function deployada/servida.
- Possiveis rejeicoes SEFAZ especificas apos envio com dados reais.
