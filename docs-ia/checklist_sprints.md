# Checklist de Sprints — MVP Gestão Comercial

Ordem sequencial sugerida. Marque os itens conforme conclusão.

---

## Sprint 1 — Autenticação e shell da aplicação

- [x] Configurar Firebase Auth (e-mail/senha) via `auth.service.ts`
- [x] Tela de login (UI pura + hook de autenticação)
- [x] Fluxo de logout
- [x] Proteção de rotas (área autenticada vs. pública)
- [x] Layout base: painel inicial + menu de navegação (sidebar)
- [x] Rotas placeholder para módulos: Vendas, Despesas, Financeiro, Estoque, Caixa, DRE
- [x] Garantir que nenhum `.tsx` chame Firebase diretamente

---

## Sprint 2 — Cadastros mestres (Clientes e Vendedores)

- [x] Modelagem Firestore: `clients`, `sellers`
- [x] Domain types para Cliente e Vendedor
- [x] `database.service` / services específicos de CRUD
- [x] Hooks de listagem e formulário
- [x] Telas: listar / criar / editar clientes
- [x] Telas: listar / criar / editar vendedores
- [x] Validações básicas de formulário (campos obrigatórios)

---

## Sprint 3 — Módulo de Vendas

- [x] Modelagem Firestore: `sales` (refs a cliente e vendedor + valor + metadados)
- [x] Domain types de Venda
- [x] Service + hooks de vendas
- [x] Formulário de registro (seleção cliente/vendedor, valor, dados)
- [x] Listagem / histórico de vendas
- [x] Detalhe com principais dados comerciais
- [x] Validação de consistência cliente/vendedor no service (pronta para espelhar em Cloud Functions)

---

## Sprint 4 — Despesas e preparação fiscal

- [x] Modelagem Firestore: `expenses`
- [x] Cadastro de despesa (descrição, categoria, valor, data)
- [x] Listagem / histórico
- [x] Service + hooks
- [x] Estrutura desacoplada para futuro emissor de NF (interface/porta + stub)
- [x] **Não** implementar regras fiscais não definidas pelo cliente

---

## Sprint 5 — Financeiro (Contas a pagar e receber)

- [ ] Modelagem: `accountsPayable`, `accountsReceivable`
- [ ] CRUD contas a pagar (valor, vencimento, status)
- [ ] CRUD contas a receber (valor, vencimento, status)
- [ ] Listagens com filtro simples por status (se necessário ao fluxo)
- [ ] Centralizar regras de status/cálculos críticos em Cloud Functions

---

## Sprint 6 — Caixa e Estoque

- [ ] Modelagem: `cashMovements`, `inventoryItems`
- [ ] Caixa: registrar/acompanhar entradas e saídas
- [ ] Caixa: consulta de movimentações e saldo movimentado (cálculo no backend)
- [ ] Estoque: cadastro de itens e quantidade disponível
- [ ] Estoque: consulta / acompanhamento básico

---

## Sprint 7 — DRE simplificada e integração dos módulos

- [ ] Visão DRE: receitas, despesas, saldo/resultado (agregação via backend)
- [ ] Integrar navegação padronizada entre todos os módulos
- [ ] Revisar fluxos de cadastro (clientes, vendedores, estoque)
- [ ] Revisar fluxos financeiros (despesas, pagar/receber, caixa)
- [ ] Revisar vendas e relacionamentos
- [ ] Smoke test de login/logout
- [ ] Ajustes finais de UI conforme `design_system.md`
- [ ] Deploy da v1 (Firebase Hosting) e checklist de aceite

---

## Observações de execução

1. Não avançar features fora do escopo sem validação do cliente.
2. Manter Clean Architecture: Presentation → Hooks → Services → Firebase.
3. Emissor de NF permanece stub/porta até definição fiscal.
4. Cálculos financeiros críticos e validações importantes ficam no backend.
