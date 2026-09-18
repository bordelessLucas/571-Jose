# Relatorio de implementacao - Focus NFe e UX CRUD

Data: 18/09/2026
Projeto Firebase: `jose-7db7c`

## Objetivo

Preparar o sistema para integracao futura com Focus NFe e melhorar os fluxos operacionais de cadastro, consulta, adicao, edicao e remocao, sem depender do plano Blaze neste momento.

## Implementado hoje

### Integracao Focus NFe segura

- Criada estrutura de Firebase Functions em `functions/`.
- Criada Function HTTP `emitNfe` para atuar como proxy server-side da Focus NFe.
- Atualizado `firebase.json` com rewrite `/api/focus/nfe` para a Function `emitNfe`.
- Alterado adapter live do frontend para chamar o proxy autenticado, em vez de chamar a Focus direto do navegador.
- Removida a dependencia de token Focus em variavel publica `VITE_`.
- Criados exemplos de configuracao:
  - `.env.example`
  - `functions/.env.example`
- Adicionado `functions/lib` ao `.gitignore`.

### Dados fiscais de cliente

- Ampliado modelo de cliente com:
  - numero;
  - bairro;
  - municipio;
  - UF;
  - CEP;
  - inscricao estadual;
  - indicador de inscricao estadual.
- Formulario de cliente reorganizado para dados de contato e dados fiscais.
- Campo CEP agora consulta ViaCEP automaticamente ao digitar 8 numeros.
- Busca por CEP preenche logradouro, bairro, municipio e UF sem sobrescrever campos preenchidos manualmente.
- Documento e telefone passam por sanitizacao simples de digitos.
- Listagem de clientes exibe badge fiscal:
  - `Completo`;
  - `Pendente`.

### Dados fiscais de produto/estoque

- Ampliado modelo de item de estoque com:
  - NCM;
  - CFOP;
  - origem ICMS;
  - CST/CSOSN ICMS.
- Formulario de estoque atualizado com secao fiscal.
- Listagem de estoque exibe NCM.
- Listagem de estoque exibe badge fiscal:
  - `Completo`;
  - `Pendente`.

### Fluxo de venda

- Ao selecionar cliente/produto na venda, o sistema verifica pendencias fiscais.
- Se houver pendencias, exibe alerta operacional sem bloquear a venda.
- Alerta inclui links rapidos para revisar cliente e produto.
- Emissao fiscal mock/live passa a receber dados fiscais reais do cliente e do produto quando cadastrados.
- Reemissao de NF-e busca os dados fiscais atuais do produto antes de montar o payload.

### Especialista de UX CRUD

- Criado subagente reutilizavel:
  - `.cursor/agents/crud-fiscal-ux-specialist.md`
- O agente orienta revisoes futuras de UX operacional para sistemas CRUD fiscais, focando:
  - cadastro;
  - listagem;
  - edicao;
  - remocao;
  - leitura de informacoes;
  - prontidao fiscal;
  - qualidade de entrada de dados.

### Ajustes de UI

- Componente `Alert` agora aceita conteudo React, permitindo links e componentes dentro dos avisos.
- Mantida compatibilidade com dados antigos no Firestore; novos campos abrem vazios/default quando ausentes.

## Dados do emitente adicionados ao `.env` local

- CNPJ: `09087684000266`
- Nome: `Central gas e agua Ltda`
- Nome fantasia: `Central gas e agua`
- E-mail: `rapidaogasmaceio@gmail.com`
- Telefone: `82996566491`

Campos ainda pendentes para emissao real:

- logradouro;
- numero;
- bairro;
- municipio;
- UF;
- CEP;
- inscricao estadual;
- regime tributario.

## Validacoes realizadas

App principal:

```bash
cmd /c npm run build
```

Resultado: passou.

Firebase Functions:

```bash
cmd /c npm run build
```

Resultado: passou.

## Limitacoes atuais

- O projeto ainda nao tem plano Blaze ativo.
- Sem Blaze, nao foi possivel ativar Secret Manager para armazenar `FOCUS_NFE_TOKEN`.
- Sem Secret Manager/Functions em producao, a emissao real segura deve continuar desligada.
- Recomendacao atual: manter `VITE_FOCUS_NFE_MODE=mock` ate ativar Blaze.

## Proximos passos recomendados

1. Completar dados fiscais reais do emitente.
2. Completar clientes com endereco fiscal via CEP.
3. Completar produtos com NCM/CFOP/ICMS corretos.
4. Ativar plano Blaze no Firebase.
5. Salvar secret `FOCUS_NFE_TOKEN`.
6. Fazer deploy de Functions e Hosting.
7. Trocar `VITE_FOCUS_NFE_MODE=live` e testar emissao real em homologacao.
