# 571-Jose — Gestão Comercial e Financeira

Sistema de gestão (MVP) com **React + TypeScript + Vite + Tailwind + Firebase**.

## Documentação viva

- [docs-ia/escopo.md](docs-ia/escopo.md)
- [docs-ia/design_system.md](docs-ia/design_system.md)
- [docs-ia/checklist_sprints.md](docs-ia/checklist_sprints.md)

## Setup local

1. Copie `.env.example` para `.env` e preencha as variáveis `VITE_FIREBASE_*`.
2. `npm install`
3. `npm run dev`

## Estrutura

```
src/
  domain/          # Tipos e contratos
  hooks/           # Lógica de negócio (custom hooks)
  presentation/    # UI pura (components / pages)
  services/        # Firebase e integrações (sem UI)
```
