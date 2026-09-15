# Escopo do Projeto — Sistema de Gestão Comercial e Financeira

## Objetivo principal

Entregar a **primeira versão funcional** de um sistema de gestão comercial e financeira que centralize, em um único ambiente web:

- clientes e vendedores
- vendas
- despesas
- contas a pagar e receber
- caixa
- estoque
- visão simplificada de DRE

A plataforma deve ser organizada, simples de usar e preparada para evoluções futuras (financeiro avançado, fiscal e relatórios), **sem inventar funcionalidades fora do escopo**.

## Stack confirmada

| Camada | Tecnologia |
| --- | --- |
| Frontend | React + TypeScript + Vite |
| UI | Tailwind CSS |
| Auth | Firebase Authentication |
| Banco | Cloud Firestore |
| Backend / regras | Firebase Cloud Functions |
| Deploy | Firebase Hosting |
| Fiscal (futuro) | API externa NF-e/NFS-e (desacoplada) |

## Perfis de usuário

O documento de contexto **não detalha perfis distintos** (Admin, Operador, etc.) na v1.

Para o MVP:

| Perfil | Descrição |
| --- | --- |
| **Usuário autenticado** | Acesso completo aos módulos após login com e-mail/senha. Único perfil operacional da v1. |

> Qualquer segregação de papéis (Admin vs. Colaborador) fica **fora do escopo** até validação explícita do cliente.

## Regras de negócio

1. Acesso somente após autenticação (login + senha); deve existir logout.
2. Após o login, o usuário vê painel inicial e menu de navegação entre módulos.
3. Clientes e vendedores são cadastros mestres usados nos registros de vendas.
4. Cada venda relaciona **cliente**, **vendedor** e **valor**, com histórico consultável.
5. Despesas possuem descrição, categoria, valor, data e histórico consultável.
6. Contas a pagar e a receber possuem valor, vencimento, status e consulta.
7. Caixa acompanha entradas, saídas, movimentações e saldo movimentado.
8. Estoque permite cadastro de itens, quantidade disponível e consulta básica.
9. DRE v1 é **simplificada**: receitas, despesas e saldo/resultado — sem regras contábeis avançadas.
10. Emissor de Nota Fiscal: apenas **estrutura/preparação desacoplada**; **não** implementar regras fiscais não definidas pelo cliente.
11. Validações importantes e cálculos financeiros críticos devem ser centralizados no backend (Cloud Functions), não só no frontend.
12. Relacionamentos entre clientes, vendedores, vendas e registros financeiros devem permanecer consistentes.
13. Módulos devem permanecer desacoplados para facilitar evolução.
14. Não inventar funcionalidades; o que estiver fora do escopo exige validação do cliente.

## Funcionalidades core (MVP)

### Acesso e shell

- [ ] Login (usuário/senha)
- [ ] Logout
- [ ] Painel inicial
- [ ] Menu de navegação
- [ ] Organização dos módulos: Vendas, Despesas, Financeiro, Estoque, Caixa, DRE

### Clientes

- [ ] Cadastro (nome, dados básicos, contato)
- [ ] Consulta
- [ ] Uso do cliente em vendas

### Vendedores

- [ ] Cadastro
- [ ] Consulta
- [ ] Associação a vendas

### Vendas

- [ ] Registro (cliente, vendedor, valor, dados da venda)
- [ ] Histórico / consulta
- [ ] Visualização dos principais dados comerciais

### Despesas

- [ ] Registro (descrição, categoria, valor, data)
- [ ] Histórico / consulta
- [ ] Estrutura preparada para emissor de NF (sem regras fiscais)

### Financeiro

- [ ] Contas a pagar (cadastro, valor, vencimento, status, consulta)
- [ ] Contas a receber (cadastro, valor, vencimento, status, consulta)

### Caixa

- [ ] Entradas e saídas
- [ ] Consulta de movimentações
- [ ] Visualização de saldo movimentado

### Estoque

- [ ] Cadastro de itens
- [ ] Quantidade disponível
- [ ] Consulta / acompanhamento básico

### DRE

- [ ] Visão simplificada: receitas, despesas, saldo/resultado

### Fechamento da v1

- [ ] Integração dos módulos principais
- [ ] Navegação padronizada
- [ ] Revisão dos fluxos de cadastro, financeiro, vendas, estoque e caixa
- [ ] Login/logout estáveis
- [ ] Interface utilizável em operação real

## Fora de escopo (v1)

- Regras contábeis avançadas
- Implementação fiscal completa (NF-e/NFS-e operacional)
- Perfis/ACL detalhados (não especificados)
- Relatórios avançados além do DRE simplificado
- Qualquer feature não listada neste documento
