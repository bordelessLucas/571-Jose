# Auditoria UI/UX — José Gestão Comercial (2026-03)

Auditoria sênior (front + arquitetura CRUD empresarial + controle/emissão NF-e).  
Escopo: `src/presentation/**`, shell, auth, todos os módulos CRUD existentes.  
Direção: painel administrativo denso e sóbrio (alinhado a `design_system.md`), não landing.

## P0 — Corrigir agora

| # | Problema | Evidência | Impacto | Correção |
| --- | --- | --- | --- | --- |
| 1 | Status NF-e é texto plano; operador não distingue autorizado/erro/rejeitado | `SalesPage`, `SaleDetailPage` | Risco fiscal: reemissão/consulta sem hierarquia visual | `StatusBadge` com tons success/danger/warning/muted |
| 2 | Reemitir NF-e sem confirmação | `SaleDetailPage` | Pode cancelar doc ativo por clique acidental | Dialog de confirmação com aviso fiscal |
| 3 | `outline-none` sem `focus-visible` | `Input`, `Select`, `TextArea`, `Button` | Teclado/a11y quebrados | Anel `focus-visible` nos controles |
| 4 | Alertas sem `aria-live` | `Alert.tsx` | Erros assíncronos invisíveis a leitores de tela | `role="alert"` / `aria-live="polite"` |
| 5 | Exclusões via `window.confirm` | Todas as listagens | UX frágil, sem contexto do registro | `ConfirmDialog` acessível |
| 6 | Empty states sem CTA | `DataTable` | Operador trava em lista vazia | `EmptyState` com ação «Novo…» |
| 7 | Débito vencido pouco destacado no insight | `SaleFormPage` ClientInsight | Venda a cliente inadimplente sem alerta visual | Painel danger + totais em destaque |

## P1 — Alto impacto de fluxo

| # | Problema | Correção |
| --- | --- | --- |
| 1 | Contas vencidas / status financeiro sem chip | `StatusBadge` em pagar/receber |
| 2 | Top bar + sidebar redundantes; falta skip-link | Skip link → `#main-content` |
| 3 | Contagem de resultados ausente (filtro vendas) | Contador «N de M» nas listas |
| 4 | Formulários sem `type=tel` / `spellCheck` | Ajuste em clientes/vendedores/login |
| 5 | Finance hub sem focus ring igual ao dashboard | `ModuleCard` compartilhado |
| 6 | Spinner ignora `prefers-reduced-motion` | CSS global + spinner estático |
| 7 | Detalhe da venda: NF pouco hierárquico | Bloco fiscal destacado + link receber |
| 8 | Lista sem produtos/clientes no form de venda | Alertas com link para cadastro |

## P2 — Polimento

- `color-scheme: light`, `touch-action: manipulation`, safe-area
- `tabular-nums` em moeda
- `text-wrap: balance` em títulos
- Transições explícitas (sem `transition: all`)
- Densidade de tabela um pouco maior (py-2.5)

## Fixes applied

### Foundation
- Tokens CSS: `color-scheme`, focus ring, reduced motion, safe-area, skip-link, tabular-nums
- `Button` / `Input` / `Select` / `TextArea`: `focus-visible`, estados de erro/hint
- `Alert`: `aria-live` + tom `warning`
- `Spinner`: `role="status"`
- Novos: `StatusBadge`, `EmptyState`, `ConfirmDialog`, `ModuleCard`
- `DataTable`: empty com CTA, caption, densidade, sticky header
- `PageHeader`: `text-balance` + meta (contadores)

### Shell / auth / hubs
- Skip link → `#main-content`
- Top bar sticky; brand sem ALL-CAPS forçado
- Login: `spellCheck`/`inputMode`, loading de sessão
- Dashboard / Financeiro: `ModuleCard` com focus ring; copy alinhada a NF-e/estoque

### Vendas / NF-e
- Lista: badge NF-e, vencimento em vermelho, filtro com contagem, empty CTA, confirm delete
- Detalhe: bloco fiscal destacado, confirm de reemissão, link a receber
- Form: insight com alerta de débito vencido; avisos se faltar cliente/estoque

### CRUD demais módulos
- Confirm dialog em todas as exclusões (sem `window.confirm`)
- Empty states com ação primária
- Badges em vendedor, estoque baixo/zerado, caixa, pagar/receber vencidos
- DRE com `tabular-nums`
- Cliente: `type=tel` e endereço com autocomplete

## Residual (P2 futuro)
- Sync de filtros na URL (`?q=` / `?status=`)
- Virtualização de tabelas muito grandes
- Guard de formulário sujo (`beforeunload`)

