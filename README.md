# devrecap

> Gerador automatizado de brag documents — coleta PRs, commits e issues do Jira para produzir documentos de performance trimestral.

Registre e comunique o impacto real do seu trabalho. Feito para engenheiros de software que querem manter um histórico visível das suas entregas sem gastar horas escrevendo retrospectivas.

[Read in English](./README.en.md)

---

## O que é gerado

Para cada trimestre ou sprint, dois documentos são produzidos:

| Arquivo | Finalidade |
|---------|-----------|
| `docs/{ano}/Q{n}-{ano}.md` | Brag document completo — PRs, métricas, épicos, destaques técnicos |
| `docs/{ano}/Q{n}-{ano}-checkin.md` | Resumo conciso de 4 seções para 1:1s e avaliações de performance |

---

## Requisitos

- Node.js 24+
- [GitHub CLI](https://cli.github.com/) (`gh`) — autenticado com sua conta
- Conta no Atlassian Cloud (Jira) — opcional, para cruzar issues com PRs

---

## Início rápido

```bash
# 1. Clone e instale
git clone https://github.com/Romulosanttos/devrecap.git
cd devrecap
npm install

# 2. Configure
cp .env.example .env
# Edite o .env com seu usuário e org do GitHub

# 3. Colete os dados do GitHub
npm run collect -- Q2-2026

# 4. Consulte o Jira via Claude Code ou GitHub Copilot (veja abaixo)
# Depois peça ao assistente para gerar os documentos
```

---

## Configuração

Copie `.env.example` para `.env` e preencha:

```bash
GH_USER=seu-usuario-github
GH_ORG=sua-org-github        # use seu usuário para repos pessoais
JIRA_PROJECT=CHAVE_DO_PROJETO
JIRA_ACCOUNT_ID=seu-account-id-jira
JIRA_SITE_URL=https://sua-org.atlassian.net
```

> `.env` está no `.gitignore`. Nunca faça commit desse arquivo.

---

## Configuração do MCP do Atlassian

Conecte seu assistente de IA ao Jira usando o [Atlassian Rovo MCP Server](https://support.atlassian.com/atlassian-rovo-mcp-server/).
A autenticação usa OAuth 2.1 — uma janela do browser abre no primeiro uso.

### GitHub Copilot (VS Code)

O arquivo `.mcp.json` já está incluído no repositório. O VS Code detecta automaticamente.

Para adicionar manualmente via Command Palette:
1. `MCP: Add Server`
2. Selecione **HTTP**
3. URL: `https://mcp.atlassian.com/v1/mcp`
4. Nome: `atlassian`

### Claude Code

Adicione ao `~/.claude.json` (config global):

```json
{
  "mcpServers": {
    "atlassian": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp"
    }
  }
}
```

Ou via CLI:

```bash
claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp
claude mcp list   # deve mostrar: atlassian — Connected
```

**Fallback** para versões antigas do Claude Code:

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.atlassian.com/v1/mcp"]
    }
  }
}
```

---

## Fluxo completo

### Passo 1 — Coletar dados do GitHub

```bash
npm run collect -- Q2-2026
# ou para um intervalo customizado:
npm run collect -- sprint-42 --start 2026-01-13 --end 2026-01-24
```

Salva os dados brutos em `data/github/Q2-2026.json`.

### Passo 2 — Coletar dados do Jira (via assistente de IA)

Com Claude Code ou GitHub Copilot com o MCP do Atlassian configurado, faça uma consulta como:

> "Busque no Jira todas as issues atribuídas a mim no projeto `PROJ` com status Done,
> atualizadas entre 2026-04-01 e 2026-06-30. Salve o resultado em
> `data/jira/Q2-2026.json`."

### Passo 3 — Preencher contexto adicional

Edite `prompts/questions.md` com sua perspectiva sobre o período:

- Principais entregas e por que importaram
- Blockers ou replanejamentos
- Aprendizados e ajustes
- Métricas específicas a destacar

Esse arquivo dá ao assistente contexto que não está nos dados brutos do GitHub/Jira.

### Passo 4 — Gerar os documentos

No VS Code, abra o Copilot Chat e digite:

```
/generate-brag Q2-2026
```

Ou no Claude Code:

> "Use a skill generate-brag para o período Q2-2026."

O assistente vai ler `data/github/Q2-2026.json`, `data/jira/Q2-2026.json` e
`prompts/questions.md`, e escrever os dois documentos em `docs/2026/`.

---

## Estrutura do projeto

```
src/
  collect-github.ts   # CLI de coleta de dados do GitHub
  types.ts            # Interfaces TypeScript
  lib/                # Módulos de config, período e coleta

data/                 # gitignored — JSON bruto (estrutura rastreada via .gitkeep)
  github/
  jira/

docs/                 # brag documents gerados (versione esses!)
  2026/
    Q1-2026.md
    Q1-2026-checkin.md

prompts/
  questions.md        # preencha antes de gerar — seu contexto sobre o período

.github/
  workflows/
    ci.yml            # GitHub Actions: typecheck + lint + testes no push/PR
  skills/
    generate-brag/    # comando /generate-brag no Copilot Chat
      SKILL.md
      assets/

.env.example          # template de configuração
.mcp.json             # config MCP para VS Code / GitHub Copilot
.claude/
  settings.json       # config MCP para Claude Code + arquivos de contexto
  skills/
    generate-brag -> ../../.github/skills/generate-brag  # symlink
.vscode/
  settings.json       # configurações do VS Code — instruções para o Copilot
```

---

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run collect -- Q{n}-{ano}` | Coleta dados do GitHub para um trimestre |
| `npm run collect -- sprint-N --start DATA --end DATA` | Coleta para um intervalo customizado |
| `npm run typecheck` | Verificação de tipos TypeScript |
| `npm run lint` | Lint do código fonte |
| `npm run test` | Executa os testes |
| `npm run test:ci` | Testes com relatório de cobertura |

---

## Formatos de saída

### Brag Document — `Q{n}-{ano}.md`

```markdown
# Brag Document — Q{n} {ano}
**Período:** {início} → {fim}
**Autor:** Seu Nome | Sua Empresa

## Resumo Executivo
3–4 frases sobre os principais temas do trimestre e seu impacto para o negócio.

## Entregas por Épico / Iniciativa
### {Nome do épico}
- O que foi entregue e qual o impacto
- Issues relacionadas
- PRs relevantes

## Pull Requests Mergeados ({total})
Tabela com: repositório, título, data, link

## Métricas
- PRs mergeados: X (Y repos)
- Commits: X
- Issues fechadas: X
- Story points: X

## Destaques Técnicos
Decisões arquiteturais, problemas complexos resolvidos, melhorias de qualidade.

## Aprendizados e Crescimento
Novas tecnologias, mentoria, documentação produzida.
```

### Check-in Summary — `Q{n}-{ano}-checkin.md`

Formato conciso de 4 seções para 1:1s e conversas de performance:

```markdown
# Check-in de Performance — Q{n} {ano}

## O que foi entregue e por quê?
Descreva O QUÊ foi entregue + POR QUÊ importa (impacto, conexão com prioridades do time).

## O que está em andamento, bloqueado ou foi replanejado?
Seja explícito sobre blockers e contexto para qualquer replanejamento.

## O que você identificou ou ajustou?
Aprendizados, mudanças de abordagem, feedbacks absorvidos.

## O que você precisa alinhar ou pedir apoio?
Pedidos concretos: prioridades, desbloqueio, validações.
```

**Dicas para um bom check-in:**
- Seja específico — cite exemplos concretos
- Conecte entregas a resultados do time ou do negócio
- Nomeie blockers e o que está sendo feito sobre eles
- Torne os pedidos claros e acionáveis

---

## Templates JQL para o Jira

Substitua os placeholders com seus valores do `.env`:

```
# Issues concluídas no trimestre
project = CHAVE_DO_PROJETO
  AND assignee = "SEU_ACCOUNT_ID_JIRA"
  AND statusCategory = Done
  AND updated >= "AAAA-MM-DD"
  AND updated <= "AAAA-MM-DD"
ORDER BY updated ASC

# Issues em andamento
project = CHAVE_DO_PROJETO
  AND assignee = "SEU_ACCOUNT_ID_JIRA"
  AND statusCategory != Done
  AND updated >= "AAAA-MM-DD"
ORDER BY updated DESC
```

> **Dicas:**
> - Use `statusCategory = Done` (não `status = "Done"`) — mais seguro entre configurações de board
> - Use `updated` (não `resolved`) para capturar toda a atividade do período
> - Seu Jira Account ID está na URL do seu perfil no Atlassian

---

## Fluxo de sprint

```bash
# Colete ao final de cada sprint
npm run collect -- sprint-42 --start AAAA-MM-DD --end AAAA-MM-DD

# Versione os dados brutos
git add data/github/sprint-42.json data/jira/sprint-42.json
git commit -m "chore(data): Sprint 42 — X issues, Y PRs mergeados"
```

---

## Licença

Apache 2.0 — Copyright 2026 [Rômulo Santos](https://github.com/Romulosanttos).  
Qualquer uso, fork ou distribuição deve preservar este aviso de copyright.
