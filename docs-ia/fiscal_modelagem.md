# Modelagem — Emissor de Nota Fiscal (preparação)

> Status: **contrato/porta prontos**. Emissão real **ainda não implementada**.
> Pré-requisito: CRUD operacional estável (concluído nas sprints 1–7).

## Objetivo

Manter a emissão fiscal **desacoplada** do núcleo comercial/financeiro, permitindo
trocar a API (NF-e / NFS-e) sem alterar telas de venda/despesa.

## Domínio (`src/domain/types`)

| Tipo | Papel |
| --- | --- |
| `FiscalDocumentType` | `nfe` \| `nfse` |
| `FiscalDocumentStatus` | `draft` \| `queued` \| `authorized` \| `rejected` \| `cancelled` |
| `FiscalInvoiceRequest` | Payload de emissão (referência, valor, destinatário opcional) |
| `FiscalInvoiceResult` | Resposta padronizada (status, protocolo, externalId) |

Referências suportadas no request: `sale` | `expense` | `account_receivable`.

## Porta (`src/services/fiscal.service.ts`)

```ts
interface FiscalEmitterPort {
  requestInvoice(payload): Promise<FiscalInvoiceResult>
  getStatus?(externalId): Promise<FiscalDocumentStatus>
}
```

- Implementação atual: `StubFiscalEmitter` (não chama API externa).
- Troca futura: `setFiscalEmitter(realAdapter)`.

## Fluxo alvo (próxima etapa)

1. Usuário aciona emissão a partir de Venda / Despesa / Conta a receber.
2. Hook chama `prepareFiscalEmission` (nunca Firebase/UI direto na API fiscal).
3. Adapter envia para provedor (Focus NFe, NFe.io, Bling, SEFAZ direto, etc.).
4. Persistir retorno em collection `fiscalDocuments` (a criar na sprint fiscal).
5. Atualizar status assíncrono via webhook ou polling (`getStatus`).

## O que NÃO fazer agora

- Regras fiscais (CFOP, CST, impostos, município).
- Certificado digital A1/A3.
- Comunicação SEFAZ sem provedor definido.

## Impedimentos a esclarecer com o cliente / time

1. Qual **provedor/API** de NF-e/NFS-e será usado?
2. Empresa emite **NF-e**, **NFS-e** ou ambos?
3. Há **certificado digital** e ambiente (homologação/produção)?
4. Emissão é **manual sob demanda** ou automática ao fechar venda?
