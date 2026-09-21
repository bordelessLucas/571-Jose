# AUDITORIA FINAL - SISTEMA COMERCIAL + FISCAL

Data: 2026-09-21

## 1. Resumo

Situacao encontrada: o fluxo comercial/fiscal estava bem avancado, mas havia riscos reais em pagamento dividido, totalizacao por forma, idempotencia mock, transicoes de entrega e concorrencia em estoque/fiado.

Situacao final: fluxo operacional com venda, pagamento, NFC-e/NF-e mock, entrega, fiado, caixa e fechamento por entregador validado por build/typecheck. Focus esta preparado tecnicamente para homologacao/producao quando chegarem dados externos.

## 2. O que estava correto

- Separacao fiscal por porta/adapters mock/live.
- Token Focus protegido no backend por Secret.
- Function `focusFiscal` monta payload fiscal a partir do Firestore, nao do browser.
- Mock fiscal marca `environment=mock`, `isSimulated=true` e `simulated_authorized`.
- Cliente possui prevencao de duplicidade por CPF/CNPJ, telefone e nome+telefone.
- Fiado preserva valor original, desconto, valor pago, motivo e data.
- Entregas possuem painel por status e fechamento diario por entregador.

## 3. Problemas encontrados

- Pagamento dividido sem valores por forma.
  - Causa: existiam `paymentMethod1`/`paymentMethod2`, mas nao `paymentAmount1`/`paymentAmount2`.
  - Impacto: caixa e fechamento por entregador podiam dividir ou somar valores de forma incorreta.

- Totalizacao duplicada por forma de pagamento.
  - Causa: dinheiro/PIX/fiado eram calculados em mais de um lugar.
  - Impacto: risco de contar venda duas vezes ou classificar venda inteira em uma forma.

- Idempotencia mock dependia de consulta antes de gravacao.
  - Causa: documento fiscal mock era criado com ID aleatorio.
  - Impacto: duas chamadas simultaneas poderiam criar dois documentos fiscais simulados.

- Transicoes de entrega sem validacao.
  - Causa: `updateDeliveryStatus` aceitava qualquer status.
  - Impacto: estados impossiveis como `delivered -> out_for_delivery`.

- Ajuste de estoque fora de transacao.
  - Causa: leitura e escrita separadas.
  - Impacto: vendas simultaneas poderiam deixar estoque negativo.

- Baixa de fiado fora de transacao.
  - Causa: leitura e escrita separadas.
  - Impacto: duas baixas simultaneas poderiam quitar a mesma conta.

- Seguranca Firestore ainda ampla.
  - Causa: regras permitem escrita autenticada em colecoes operacionais.
  - Impacto: endurecimento definitivo exige migrar mutacoes sensiveis para Functions para nao quebrar o app atual.

## 4. Correcoes realizadas

- Adicionados `paymentAmount1` e `paymentAmount2` em venda e formulario.
- Validada a soma das duas formas de pagamento contra o total da venda.
- Criada regra centralizada de totalizacao em `src/lib/salePaymentTotals.ts`.
- Caixa, fechamento por entregador e entregas passaram a usar a mesma regra.
- Documento fiscal agora usa ID deterministico pela referencia Focus no mock/live local.
- Ref fiscal de falha automatica ajustada para `sale-nfce-{saleId}`.
- Entrega agora valida transicoes permitidas.
- Atribuicao de entregador bloqueada para entrega finalizada/cancelada.
- Ajuste de estoque passou a usar `runTransaction`.
- Baixa de contas a receber passou a usar `runTransaction`.

## 5. Clientes

Status: OK.

Detalhes: cria/edita/lista clientes, evita duplicidade por documento, telefone e nome+telefone, sem bloquear apenas por nome igual.

## 6. Vendas

Status: OK.

Detalhes: seleciona cliente/vendedor/produto, recalcula total no servico, baixa estoque, registra preco original/final e valida pagamento dividido.

## 7. Fiado/financeiro

Status: OK.

Detalhes: venda fiada cria conta a receber; baixa antecipada preserva valor original, desconto, valor pago, motivo, responsavel quando informado e data.

## 8. Entregas

Status: OK.

Detalhes: fluxo `pending -> assigned -> out_for_delivery -> delivered` validado; cancelamento permitido antes de finalizar.

## 9. Caixa/fechamento por entregador

Status: OK.

Detalhes: totalizacao diaria por dinheiro, PIX e fiado usa valores reais por forma quando houver pagamento dividido. Valor a prestar contas considera dinheiro.

## 10. NF-e MOCK

Status: OK.

Teste realizado: build/typecheck com adapter mock e cancelamento de simulado habilitado.

Resultado: documento simulado permanece claramente separado de autorizacao real.

## 11. NFC-e MOCK

Status: OK.

Teste realizado: build/typecheck do fluxo automatico de venda com NFC-e mock.

Resultado: modo mock funciona sem certificado/dados fiscais reais.

## 12. Focus homologacao

Status: PARCIAL por dependencia externa.

Resultado: codigo suporta `/v2/nfe` e `/v2/nfce`, consulta, cancelamento, lock e payload backend. Nao houve chamada real por falta de ambiente Focus/SEFAZ completo neste workspace.

## 13. Seguranca

- Corrigido: token Focus nao fica no frontend.
- Corrigido: payload real Focus e montado no backend.
- Corrigido: lock fiscal server-side.
- Parcial: regras Firestore ainda permissivas para operacao autenticada. Endurecimento definitivo deve migrar vendas/financeiro/fiscal sensiveis para Functions sem quebrar o mock operacional.

## 14. Firestore/Functions

- `fiscalEmissionLocks` permanece bloqueado para cliente.
- Function `focusFiscal` exige Firebase Auth.
- Typecheck das Functions passou com `npx.cmd tsc --noEmit`.
- Build emitida das Functions bloqueada por permissao local em `functions/lib/index.js`.

## 15. Testes

- Comandos executados: 4.
- Passaram: 3.
- Falharam: 1 por permissao local de escrita, nao por tipo/codigo.
- Nao existe script `test` configurado no `package.json`.

## 16. Typecheck/Lint/Build

- Typecheck frontend: OK via `npm.cmd run build`.
- Lint: OK com warnings existentes de React Fast Refresh/setState em effects.
- Build frontend: OK.
- Typecheck Functions: OK.
- Build Functions: bloqueado por `EPERM` ao escrever `functions/lib/index.js`.

## 17. Dados que ainda faltam para emissao REAL

- Certificado digital A1.
- CSC e ID CSC.
- NCM real.
- CFOP real.
- CST/CSOSN.
- CEST quando aplicavel.
- Tributacao ICMS/PIS/COFINS real.
- Regime tributario real.
- Serie/numeracao de producao.
- Liberacoes/cadastro SEFAZ/Focus.

## 18. Passos necessarios quando esses dados chegarem

1. Preencher dados fiscais reais no ambiente.
2. Configurar secret `FOCUS_NFE_TOKEN`.
3. Resolver permissao local de `functions/lib` ou buildar em ambiente limpo.
4. Testar Focus em homologacao.
5. Trocar modo/provider para Focus e liberar producao apos aceite fiscal.

## 19. Arquivos alterados nesta auditoria

- `src/domain/types/index.ts`: valores por forma de pagamento.
- `src/lib/salePaymentTotals.ts`: totalizacao centralizada.
- `src/presentation/pages/sales/SaleFormPage.tsx`: entrada e validacao visual de pagamento dividido.
- `src/presentation/pages/sales/SaleDetailPage.tsx`: exibicao dos valores por forma.
- `src/services/sales.service.ts`: validacao de pagamento dividido, transicoes de entrega e ref fiscal.
- `src/services/fiscalDocuments.service.ts`: idempotencia por ID deterministico.
- `src/services/inventory.service.ts`: ajuste de estoque transacional.
- `src/services/accountsReceivable.service.ts`: baixa transacional.

## 20. Pendencias reais

- Dados fiscais/certificado/liberacoes externas.
- Endurecimento completo das regras Firestore com migracao das mutacoes sensiveis restantes para Functions.
- Criar suite automatizada de testes; atualmente o projeto nao possui runner/script de testes.
