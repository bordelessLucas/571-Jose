# Modelagem — Focus NFe (NF-e)

> Status: **adapter mock + HTTP prontos**. Emissão automática ao fechar venda.
> Certificado digital: ainda pendente no cliente. Token: template até Focus liberar.

## Decisões confirmadas

| Item | Valor |
| --- | --- |
| Provedor | Focus NFe |
| Documento | **somente NF-e** (NFS-e fora) |
| Momento | **automático ao criar/fechar venda** |
| Certificado | ainda não disponível |
| Testes | `VITE_FOCUS_NFE_MODE=mock` + token template |

## Variáveis de ambiente

```env
VITE_FOCUS_NFE_MODE=mock|live
VITE_FOCUS_NFE_ENV=homologacao|producao
VITE_FOCUS_NFE_TOKEN=FOCUS_NFE_TOKEN_TEMPLATE_REPLACE_ME
VITE_EMITENTE_*   # dados cadastrais do emitente
```

## Arquitetura

```
sales.service.createSale
  → prepareFiscalEmission (porta)
      → FocusNfeMockAdapter  (default)
      → FocusNfeHttpAdapter  (live)
  → fiscalDocuments (Firestore)
  → atualiza sale.fiscalStatus / fiscalRef
```

## Segurança

- Token Focus **não deve** ficar só no browser em produção.
- Chamada HTTP direta pode falhar por **CORS**.
- Próximo passo operacional: proxy em Cloud Function com secret `FOCUS_NFE_TOKEN`.

## Como testar

1. `npm run seed:clear` — popula volume grande com NF-e mock.
2. Criar venda no app → status NF-e aparece na listagem/detalhe.
3. Quando tiver token real: trocar `VITE_FOCUS_NFE_MODE=live` e o token (idealmente via proxy).
