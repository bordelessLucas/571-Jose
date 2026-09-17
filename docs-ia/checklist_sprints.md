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

- [x] Modelagem: `accountsPayable`, `accountsReceivable`
- [x] CRUD contas a pagar (valor, vencimento, status)
- [x] CRUD contas a receber (valor, vencimento, status)
- [x] Listagens com filtro simples por status
- [x] Regras de status/vencimento na camada de serviço (prontas para Cloud Functions)

---

## Sprint 6 — Caixa e Estoque

- [x] Modelagem: `cashMovements`, `inventoryItems`
- [x] Caixa: registrar/acompanhar entradas e saídas
- [x] Caixa: consulta de movimentações e saldo movimentado (cálculo no service)
- [x] Estoque: cadastro de itens e quantidade disponível
- [x] Estoque: consulta / acompanhamento básico

---

## Sprint 7 — DRE simplificada e integração dos módulos

- [x] Visão DRE: receitas, despesas, saldo/resultado (agregação no service)
- [x] Integrar navegação padronizada entre todos os módulos
- [x] Revisar fluxos de cadastro (clientes, vendedores, estoque)
- [x] Revisar fluxos financeiros (despesas, pagar/receber, caixa)
- [x] Revisar vendas e relacionamentos
- [x] Smoke test de login/logout (validado via Firebase SDK em ambiente publicado)
- [x] Ajustes de UI conforme `design_system.md`
- [x] Configuracao Firebase Hosting para deploy da v1
- [x] Deploy da v1 (Firebase Hosting)
- [x] Checklist de aceite funcional dos fluxos principais

---

## Próxima etapa — Emissão de NF

- [x] Definir provedor/API fiscal com o cliente (Focus NFe, somente NF-e)
- [x] Implementar adapter mock + HTTP Focus NFe
- [x] Persistência `fiscalDocuments`
- [x] Fluxo de emissão automática ao fechar venda
- [ ] Token/certificado reais + proxy Cloud Function (segurança/CORS)
- [ ] Homologação live na Focus com certificado

Ver `docs-ia/fiscal_modelagem.md`.

### Seed de validação

- [x] `npm run seed` / `npm run seed:clear` — volume grande cobrindo todos os módulos

---

## Observações de execução

1. Não avançar features fora do escopo sem validação do cliente.
2. Manter Clean Architecture: Presentation → Hooks → Services → Firebase.
3. Emissor de NF permanece stub/porta até definição fiscal.
4. Cálculos financeiros críticos e validações importantes ficam na camada de serviço (e depois em Cloud Functions).
