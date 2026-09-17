# Fechamento dos itens 1-5

Data: 2026-09-17

## Implementado sem Focus API e sem Blaze

- Firebase Hosting configurado em `firebase.json` para SPA Vite/React (`public: dist`, rewrite para `index.html`, clean URLs).
- Deploy Firebase Hosting publicado: https://jose-7db7c.web.app
- Filtros sincronizados na URL:
  - Vendas: `?q=`
  - Contas a pagar/receber: `?status=`
  - DRE: `?from=` / `?to=`
- Virtualizacao interna de tabelas grandes em `DataTable` quando a lista passa de 120 linhas.
- Guard de formulario sujo (`beforeunload`) em formularios CRUD.
- DRE gerencial evoluida com receita bruta, deducoes, receita liquida, custos, lucro bruto, despesas por categoria e resultado liquido.

## Validacao

- `npm.cmd run build`: OK.
- `npm.cmd run lint`: OK, com warnings preexistentes de hooks/setState e fast refresh.
- `npx.cmd firebase-tools deploy --only hosting`: OK.
- Checagem HTTP da URL publicada: 200.
- Smoke de login Firebase Auth via API com usuario de teste: OK.
- Rotas publicadas validadas: `/login`, `/clientes`, `/vendedores`, `/vendas`, `/despesas`, `/financeiro`, `/financeiro/pagar`, `/financeiro/receber`, `/estoque`, `/caixa`, `/dre`.
- Aceite autenticado via Firebase SDK: login, leitura de `clients`, `sellers`, `sales`, `expenses`, `accountsPayable`, `accountsReceivable`, `cashMovements`, `inventoryItems`, `fiscalDocuments` e `signOut`: OK.

## Ainda operacional/manual

- Smoke visual em navegador real ainda pode ser repetido como conferencia humana, mas o aceite funcional automatizado passou.
