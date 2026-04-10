---
name: generate-brag
description: 'Gera o brag document e o check-in summary a partir dos dados coletados do GitHub e Jira para um trimestre ou sprint. Use quando: gerar brag document, gerar checkin, documentar entregas, documentar quarter, documentar sprint, performance review, career document, Q1, Q2, Q3, Q4.'
argument-hint: 'Período, ex: Q2-2026 ou sprint-42'
---

# generate-brag

Gera dois documentos em **Português (pt-BR)** a partir dos dados coletados:

| Arquivo | Finalidade |
|---------|-----------|
| `docs/{year}/{period}.md` | Brag document completo — PRs, métricas, épicos, destaques técnicos |
| `docs/{year}/{period}-checkin.md` | Resumo para 1:1s e avaliações de performance |

---

## Pré-requisitos

Antes de executar:
1. `npm run collect -- {period}` — coleta dados do GitHub → `data/github/{period}.json`
2. Consultar Jira via MCP → `data/jira/{period}.json` (opcional)
3. Preencher [`prompts/questions.md`](../../../prompts/questions.md) com contexto adicional

---

## Procedimento

### Passo 1 — Carregar dados brutos

Ler os arquivos abaixo. Se não existir, registrar aviso e continuar com os dados disponíveis.

- `data/github/{period}.json`
- `data/jira/{period}.json`

### Passo 2 — Carregar contexto adicional

Ler `prompts/questions.md`. Extrair:
- Idioma (padrão: Português pt-BR)
- Perspectiva do engenheiro sobre as entregas
- Blockers e replanejamentos
- Métricas específicas a destacar

### Passo 3 — Cross-reference GitHub × Jira

Associar PRs a issues Jira pelo número do ticket:
1. Número no título do PR: `PROJ-123`
2. Número no nome da branch: `feature/PROJ-123-descricao`

Para cada match, anexar: título da issue, épico e story points ao PR.

### Passo 4 — Gerar o brag document

Destino:
- `Q{n}-{year}` → `docs/{year}/{period}.md`
- Sprint ou label customizado → `docs/misc/{period}.md`

Usar o template em [`./assets/brag-template.md`](./assets/brag-template.md).  
Linguagem: **Português (pt-BR)** salvo indicação contrária em `prompts/questions.md`.  
Tom: foco em **impacto de negócio**, não em tarefas.

### Passo 5 — Gerar o check-in summary

Criar `docs/{year}/{period}-checkin.md` usando o template em [`./assets/checkin-template.md`](./assets/checkin-template.md).  
Manter conciso — máximo 2–4 sentenças ou bullets por seção.

### Passo 6 — Salvar e resumir

Criar os arquivos (criar pasta se não existir). Ao final, imprimir:

```
Arquivos gerados:
  docs/{year}/{period}.md
  docs/{year}/{period}-checkin.md

Métricas:
  PRs merged: X (Y repositórios)
  Commits: X
  Issues Jira fechadas: X
  Story points: X

Issues sem PR correspondente: [lista ou "nenhuma"]
```
