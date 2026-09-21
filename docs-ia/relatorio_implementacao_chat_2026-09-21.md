# Relatorio de implementacao do chat - 2026-09-21

## Contexto

Neste chat foi continuada e consolidada a implementacao do fluxo comercial e fiscal do projeto Jose Gestao Comercial, com foco em:

- venda;
- entrega;
- fiado;
- caixa;
- contas a pagar/receber;
- emissao fiscal NF-e/NFC-e via Focus NFe;
- armazenamento e consulta de documentos fiscais;
- ajustes de usabilidade e estabilidade visual.

## Implementacoes realizadas

### Fluxo fiscal Focus NFe

- Remocao do provider mock em runtime.
- Remocao da selecao de modo fiscal por ambiente para uso em producao.
- Criacao do fluxo fiscal real usando Focus NFe via Firebase Function.
- Criacao do endpoint `focusFiscal` em Cloud Functions.
- Inclusao de autenticacao por Firebase ID token para chamadas fiscais.
- Inclusao de uso de secret `FOCUS_NFE_TOKEN` no backend.
- Montagem do payload Focus para NF-e e NFC-e a partir de dados reais de venda, cliente, produto e emitente.
- Validacao backend de configuracao fiscal obrigatoria.
- Retorno de status `fiscal_configuration_incomplete` quando faltam dados fiscais.
- Implementacao de idempotencia usando a colecao `fiscalEmissionLocks`.
- Implementacao de consulta de status fiscal.
- Implementacao de cancelamento fiscal com justificativa.
- Persistencia de documentos fiscais na colecao `fiscalDocuments`.
- Persistencia de `xmlUrl`, `pdfUrl`, chave, protocolo, serie, numero, ambiente e resposta bruta.
- Bloqueio de simulacoes fiscais em runtime.

### Fluxo de venda e emissao apos salvar

- Ajustado o fluxo para salvar venda primeiro.
- Depois da venda salva, exibicao de modal perguntando se deseja emitir:
  - NFC-e;
  - NF-e;
  - nao emitir agora.
- Se a emissao fiscal falhar por configuracao incompleta, a venda permanece salva.
- Mensagem de retorno na tela da venda informando o resultado fiscal.
- Possibilidade de emitir, consultar, cancelar e baixar XML/PDF pela tela de detalhe da venda.

### Area fiscal

- Criada area `Fiscal` no menu principal.
- Criada pagina de armazenamento/listagem de documentos fiscais.
- Listagem de documentos por venda, tipo, status, cliente, valor, chave e ambiente.
- Acoes para abrir XML e PDF quando a Focus retornar os links.
- Rota criada em `/fiscal`.

### Financeiro

- Contas a pagar ficaram mais faceis de operar.
- Status de conta a pagar pode ser alterado diretamente na tabela por um seletor.
- Implementado update direto de status para:
  - pendente;
  - pago;
  - cancelado.

### Fluxo de pagamento na venda

- Simplificado o formulario de nova venda.
- A segunda forma de pagamento deixou de aparecer como campo obrigatorio/confuso.
- Agora a venda comeca com uma forma de pagamento principal.
- Opcao de dividir pagamento aparece apenas quando o usuario aciona esse fluxo.
- Quando nao ha segunda forma de pagamento, valores/taxas secundarias sao zerados no envio.

### Entregas

- Inclusao de area de entregas no menu.
- Inclusao de tipos e status de entrega vinculados ao fluxo de vendas.
- Venda passou a armazenar dados de entregador e status de entrega.

### Estoque, clientes e produtos

- Produtos passaram a carregar dados fiscais necessarios para emissao:
  - unidade;
  - SKU/codigo;
  - NCM;
  - CFOP;
  - CEST;
  - origem ICMS;
  - CST/CSOSN;
  - PIS;
  - COFINS.
- Clientes passaram a carregar dados fiscais e endereco fiscal usados na emissao.

### Caixa e financeiro integrado

- Venda continua movimentando o fluxo comercial mesmo quando a emissao fiscal fica bloqueada.
- Pagamentos, fiado, contas a receber, entregas e caixa continuam funcionando sem depender da NF.
- Adicionados calculos auxiliares de totais por forma de pagamento.

### Ajustes visuais e estabilidade de UI

- Removidos hovers com deslocamento fisico (`translate/scale`) de botoes, cards e menu.
- Corrigido comportamento visual que podia gerar oscilacao quando o mouse ficava na borda de elementos entre modais.
- Mantidas transicoes apenas de cor, borda, sombra e opacidade.
- Adicionados icones no menu e nos componentes principais.
- Ajustes gerais de layout, splash, cabecalhos, badges e painel.

## Deploy realizado

### Publicado com sucesso

- Firebase Hosting publicado em producao:
  - https://jose-7db7c.web.app
- Firestore Rules publicadas com sucesso.
- `firebase.json` configurado com rewrite:
  - `/api/focus/emit` -> `focusFiscal`

### Bloqueio encontrado no deploy das Functions

O deploy completo com Functions foi tentado, mas o Firebase bloqueou a publicacao da Function fiscal porque a API Secret Manager ainda esta desativada no projeto `jose-7db7c`.

Erro recebido:

```text
Secret Manager API has not been used in project jose-7db7c before or it is disabled.
```

Tambem foi identificado que o artefato local `functions/lib/index.js` estava antigo e apontava para `emitNfe`. A compilacao das Functions foi executada e o artefato local passou a exportar corretamente `focusFiscal`.

## Validacoes executadas

- `npm.cmd run build`
  - sucesso.
- `npm.cmd run lint`
  - sucesso, apenas warnings antigos de React/fast-refresh.
- `npx.cmd tsc --noEmit` em `functions`
  - sucesso.
- `npm.cmd run build` em `functions`
  - sucesso.
- Deploy Hosting + Firestore Rules
  - sucesso.

## Pendencias reais para emissao fiscal em producao

Para a NF-e/NFC-e funcionar em producao sem reconstruir o fluxo, ainda faltam configuracoes externas:

- Ativar Secret Manager API no projeto Firebase.
- Configurar o secret `FOCUS_NFE_TOKEN`.
- Fazer deploy da Function `focusFiscal`.
- Configurar no ambiente das Functions:
  - `FOCUS_NFE_ENV`;
  - `FOCUS_NFE_SERIE_NFE`;
  - `FOCUS_NFE_SERIE_NFCE`;
  - `FOCUS_NFE_CSC_NFCE`;
  - `FOCUS_NFE_ID_CSC_NFCE`;
  - `EMITENTE_CNPJ`;
  - `EMITENTE_NOME`;
  - `EMITENTE_LOGRADOURO`;
  - `EMITENTE_NUMERO`;
  - `EMITENTE_BAIRRO`;
  - `EMITENTE_MUNICIPIO`;
  - `EMITENTE_UF`;
  - `EMITENTE_CEP`;
  - `EMITENTE_IE`;
  - `EMITENTE_REGIME`.
- Inserir certificado A1 e demais dados fiscais na Focus NFe.
- Garantir credenciamento SEFAZ para NF-e/NFC-e.
- Completar dados fiscais de clientes e produtos usados na emissao.

## Estado final

O frontend e as regras Firestore estao publicados em producao.

O fluxo fiscal esta implementado sem mock runtime e preparado para emissao real via Focus NFe. No ambiente publicado, a chamada fiscal ainda depende da publicacao da Function `focusFiscal`, que esta bloqueada pela API Secret Manager desativada/configuracao do secret `FOCUS_NFE_TOKEN`.

Enquanto a configuracao fiscal estiver incompleta, o sistema deve salvar a venda normalmente e bloquear somente a emissao fiscal com status equivalente a `fiscal_configuration_incomplete`.
