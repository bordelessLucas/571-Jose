# UX Review — Sistema José (Gestão Comercial)

Auditoria das páginas em `src/presentation/pages/**` e do shell (`AppShell` / `Sidebar` / `PageHeader`).

## Findings

### Navigation
- List pages (Clientes, Vendedores, Vendas, Despesas, Estoque, Caixa, DRE) had no path back to the dashboard from `PageHeader`.
- Finance hub lacked `backTo="/"`; payable/receivable lists did not link back to `/financeiro`.
- Form and detail pages duplicated a hardcoded «Voltar» button in `actions`, while `PageHeader` already supports smart back via `backTo` + `useSmartBack`.
- Sale edit form always fell back to `/vendas` instead of preferring the sale detail when an id exists.

### Layout / polish
- Collapsed sidebar used short labels without strong `aria-label` / brand affordance; desktop icons needed clearer tooltips and focus.
- Mobile top-bar «Menu» control lacked `aria-label` / `aria-expanded`.
- Table action cells used a non-wrapping flex row (risk of cramped controls on narrow widths).
- Login branding («Acesso ao sistema») did not match the shell brand («José / Gestão Comercial»).
- Unused `ModulePlaceholderPage.tsx` remained in the tree (not referenced by the router).

### What was already OK
- Collapsible sidebar with `localStorage` (`jose.sidebar.collapsed`).
- Top bar «Ir ao painel».
- Empty / loading / error patterns via `Spinner`, `Alert`, and `DataTable` empty message.
- Design tokens in `src/index.css` aligned with `docs-ia/design_system.md` (sober admin, no purple defaults).

## Fixes applied

- Added `showDashboard` on module list pages; finance hub `backTo="/"`; payable/receivable lists `backTo="/financeiro"`.
- Forms/detail: set `backTo` to the correct module list (or sale detail when editing); removed redundant «Voltar» from `actions`.
- Sale form: `backTo={isEdit && id ? `/vendas/${id}` : '/vendas'}`.
- Sidebar: clearer collapsed brand mark, `aria-label` on nav items, `aria-expanded` on toggle, logout `type="button"`.
- AppShell mobile Menu: `aria-label` + `aria-expanded`.
- Table actions: `flex-wrap` so Edit/Delete stay readable.
- Login: brand strip + «Gestão Comercial» title aligned with the shell.
- Dashboard: light brand eyebrow + focus-visible on module links.
- Deleted unused `ModulePlaceholderPage.tsx`.

## Flow check (mental walkthrough)

Login → Dashboard → each list (`Painel`) → create (`← Voltar` / `Painel`) → save → list → edit → back (history or fallback) → dashboard → logout.
