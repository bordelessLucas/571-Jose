# Design System — Sistema de Gestão Comercial

## Direção visual

Interface **administrativa, objetiva e minimalista**, otimizada para uso diário em escritório.

- Prioridade: clareza, densidade útil de informação e navegação simples
- Evitar visual “marketing”, cards decorativos e efeitos chamativos
- Light mode como padrão da v1 (sem dark mode no MVP)
- Tom sóbrio, corporativo e legível em telas de listagem/formulário

## Referências visuais

Inspiração de produtos de back-office (não copiar UI literalmente):

- Painéis administrativos enxutos (ERP/SME)
- Layout com **sidebar + área de conteúdo**
- Tabelas e formulários como foco; poucos elementos ornamentais
- Hierarquia clara: navegação → título da página → ações → dados

## Paleta de cores

| Token | Hex | Uso |
| --- | --- | --- |
| `--color-bg` | `#F3F5F7` | Fundo da aplicação |
| `--color-surface` | `#FFFFFF` | Superfícies de conteúdo / formulários |
| `--color-surface-muted` | `#E8EDF2` | Áreas secundárias, zebra de tabela |
| `--color-border` | `#CFD8E3` | Bordas e divisores |
| `--color-text` | `#1A2332` | Texto principal |
| `--color-text-muted` | `#5B6B7C` | Texto secundário / labels auxiliares |
| `--color-primary` | `#0F4C5C` | Ações principais, links ativos, marca |
| `--color-primary-hover` | `#0A3641` | Hover de primary |
| `--color-accent` | `#E36414` | Destaques pontuais (alertas suaves, ênfase) |
| `--color-success` | `#2A9D8F` | Status positivo / pago / ok |
| `--color-warning` | `#E9C46A` | Status pendente / atenção |
| `--color-danger` | `#C1121F` | Erros / exclusão / vencido |

> Tokens CSS espelhados em `src/index.css`.

## Tipografia

| Papel | Família | Pesos |
| --- | --- | --- |
| Interface | **IBM Plex Sans** | 400, 500, 600, 700 |
| Dados / códigos / valores | **IBM Plex Mono** | 400, 500 |

### Escala tipográfica sugerida

| Elemento | Tamanho | Peso |
| --- | --- | --- |
| Título de página | 1.5rem (24px) | 600 |
| Título de seção | 1.125rem (18px) | 600 |
| Corpo | 0.9375rem (15px) | 400 |
| Label / helper | 0.8125rem (13px) | 500 |
| Tabela (células) | 0.875rem (14px) | 400 |

## Espaçamento

Escala base 4px:

| Token | Valor |
| --- | --- |
| `--space-1` | 0.25rem (4px) |
| `--space-2` | 0.5rem (8px) |
| `--space-3` | 0.75rem (12px) |
| `--space-4` | 1rem (16px) |
| `--space-5` | 1.5rem (24px) |
| `--space-6` | 2rem (32px) |
| `--space-8` | 3rem (48px) |

- Padding padrão de página: `--space-5` a `--space-6`
- Gap entre campos de formulário: `--space-4`
- Gap entre seções: `--space-6`

## Raios e bordas

| Token | Valor | Uso |
| --- | --- | --- |
| `--radius-sm` | 0.25rem | Inputs, badges |
| `--radius-md` | 0.5rem | Botões, painéis leves |
| `--radius-lg` | 0.75rem | Containers principais (com parcimônia) |

Bordas: 1px sólidas em `--color-border`. Evitar sombras profundas; se necessário, sombra sutil única.

## Componentes (diretrizes v1)

- **Botões**: primary (teal escuro), secondary (outline), danger (vermelho)
- **Inputs**: borda simples, foco com outline na primary
- **Tabelas**: cabeçalho discreto, linhas com hover muted, ações à direita
- **Sidebar**: fundo surface ou surface-muted, item ativo com primary
- **Cards**: só quando forem container de interação (formulário/filtro); não usar cards decorativos no hero/dashboard
- **Status**: chips discretos (success / warning / danger / muted)

## Estilo de UI — o que evitar

- Temas roxo/indigo “AI default”
- Dark mode forçado
- Glow, multi-shadow, pills excessivas
- Hero promocional / marketing na área logada
- Densidade visual alta com widgets irrelevantes no painel inicial

## Responsividade

- Desktop-first (uso principal em escritório)
- Sidebar colapsável / drawer em viewports menores
- Tabelas com scroll horizontal quando necessário; não quebrar legibilidade de valores financeiros
