# IMPLEMENTACAO FINAL - VENDAS + FISCAL + ENTREGA

Data: 2026-09-21

## 1. O que ja existia

- Firebase, Firestore e Firebase Functions configurados.
- CRUDs principais de clientes, estoque/produtos, vendas, financeiro, contas a receber e caixa.
- Camada fiscal inicial com adapters mock/live para Focus NFe.
- Persistencia de documentos fiscais vinculados a venda.
- Emissao fiscal iniciada no fluxo de venda.

## 2. O que foi implementado/completado

- Fluxo fiscal NF-e/NFC-e com mock explicito e Focus via backend.
- Function `focusFiscal` com token Focus no servidor, autenticacao Firebase e montagem do payload a partir do Firestore.
- Idempotencia server-side por `fiscalEmissionLocks`.
- Consulta e cancelamento fiscal.
- Entrega com atribuicao de entregador, status e painel operacional.
- Fechamento diario por entregador.
- Fechamento operacional de caixa por dinheiro, PIX, fiado e entregas.
- Controle de fiado com baixa antecipada e desconto auditavel.
- Campos fiscais de cliente e produto sem inventar dados tributarios.
- Modo mock liberado para operar mesmo com dados fiscais reais pendentes.

## 3. Venda

Status: funcional.

- Cria venda com cliente, vendedor, produto, quantidade, preco, taxa de entrega, vencimento e pagamento.
- Recalcula total no servico antes de persistir.
- Baixa estoque.
- Registra preco original/final e flag de alteracao de preco.
- Ao criar venda, tenta emitir NFC-e automaticamente conforme modo fiscal.

## 4. Cliente/fiado

Status: funcional.

- Cliente mostra ultimas compras, debitos vencidos e debitos a vencer na tela de venda.
- Venda fiada cria conta a receber vinculada a venda.
- Baixa de contas a receber permite desconto manual com motivo, valor pago, valor final, responsavel e data.

## 5. Entrega

Status: funcional.

- Venda nasce com entrega pendente.
- Painel `/entregas` permite selecionar entregador, marcar saida e marcar entregue.
- Venda guarda entregador, status, data de atribuicao, saida e entrega.

## 6. Fechamento por entregador

Status: funcional.

- Painel diario agrupa vendas por entregador.
- Mostra quantidade entregue, total vendido, dinheiro, PIX, fiado e total a prestar contas.
- Totalizacao usa regra centralizada para evitar duplicar venda quando houver duas formas de pagamento marcadas.

## 7. NF-e

Mock: funcional e marcado como `environment: "mock"` / `isSimulated: true` / `simulated_authorized`.

Focus homologacao: implementado tecnicamente; depende de Function servida/deployada, secret `FOCUS_NFE_TOKEN`, dados fiscais reais e configuracao Focus.

Producao: pronta em codigo para trocar por configuracao; depende de certificado A1, cadastro/configuracao Focus e dados fiscais reais.

## 8. NFC-e

Mock: funcional e usado como emissao automatica principal da venda.

Focus homologacao: implementado tecnicamente em `/v2/nfce`.

Producao: pronta em codigo para trocar por configuracao; depende tambem de CSC e ID CSC.

## 9. Functions criadas/alteradas

- `focusFiscal`: emissao, consulta e cancelamento de NF-e/NFC-e.
- Montagem do payload fiscal no backend.
- Lock de emissao por referencia fiscal.
- Regras bloqueiam acesso cliente a `fiscalEmissionLocks`.

## 10. Testes realizados

- `npm.cmd run build`: OK.
- `npm.cmd run lint`: OK com warnings existentes de React Fast Refresh/setState em effects.
- `npx.cmd tsc --noEmit` em `functions`: OK.
- `npm.cmd run build` em `functions`: bloqueado por `EPERM` ao escrever `functions/lib/index.js`.

## 11. Resultado do build

- Frontend buildou com sucesso.
- Functions passaram no typecheck sem emissao.
- Build emitindo JS das Functions foi bloqueado por permissao do arquivo de saida local, nao por erro TypeScript.

## 12. Dados externos ainda necessarios

- Certificado A1 e configuracao na Focus.
- Token Focus correto por ambiente.
- Regime tributario real.
- Series/numeracao NF-e e NFC-e.
- CSC e ID CSC para NFC-e.
- Dados fiscais reais da empresa.
- Dados fiscais reais dos produtos: NCM, CFOP, CST/CSOSN, CEST quando aplicavel, ICMS, PIS, COFINS e unidade fiscal.

## 13. Passos restantes para producao

1. Preencher dados fiscais reais no ambiente/configuracao.
2. Configurar secret `FOCUS_NFE_TOKEN`.
3. Resolver permissao local de escrita em `functions/lib` ou gerar build em ambiente limpo.
4. Deployar Functions e Hosting.
5. Testar NF-e/NFC-e em homologacao com venda realista.
6. Validar autorizacao, rejeicao, XML, DANFE/cupom, consulta e cancelamento.
7. Trocar `VITE_FISCAL_MODE=focus` e `FOCUS_NFE_ENV=producao` apenas apos aceite fiscal.

## 14. Arquivos principais alterados

- `functions/src/index.ts`
- `src/services/fiscal.service.ts`
- `src/services/fiscal/*`
- `src/services/fiscalDocuments.service.ts`
- `src/services/sales.service.ts`
- `src/services/accountsReceivable.service.ts`
- `src/lib/salePaymentTotals.ts`
- `src/presentation/pages/sales/SaleDetailPage.tsx`
- `src/presentation/pages/sales/SaleFormPage.tsx`
- `src/presentation/pages/deliveries/DeliveriesPage.tsx`
- `src/presentation/pages/cash/CashPage.tsx`
- `firestore.rules`
- `.env.example`
