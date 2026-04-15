# Trouw · Monorepo

Plataforma Trouw de logística B2B. Design System + módulos de produto, HTML estático, sem build-step, pronto pra GitHub + Vercel.

---

## Estrutura

```
trouw/
├── ds/
│   └── v17/
│       ├── tokens-v17.json        ← fonte canônica DTCG W3C 1.0
│       ├── showcase.html          ← guia de componentes DS v17
│       ├── showcase-v16.html      ← histórico v16
│       └── styles/
│           ├── ds-v17-primitives.css
│           └── ds-v17-legacy-aliases.css   ← bridge v16 → v17
├── cadastro/
│   └── cliente/                   ← módulo ativo
│       └── index.html             ← wizard 6 passos (single file)
├── torre-de-controle/             ← módulo ativo
│   └── index.html                 ← cockpit operacional
├── frota/                         ← placeholder (roadmap)
│   └── README.md
├── vercel.json
└── README.md
```

---

## Rotas principais

| Rota | Descrição |
|---|---|
| `/cadastro/cliente/` | Wizard de cadastro — 6 passos num único arquivo |
| `/torre-de-controle/` | Cockpit operacional — SMs, KPIs, mapa, painel de gestão |
| `/ds/v17/showcase` | Guia de componentes DS v17 |
| `/ds/v17/showcase-v16` | Showcase v16 histórico (referência) |
| `/ds/v17/tokens-v17.json` | Fonte canônica DTCG W3C 1.0 |
| `/ds/v17/styles/ds-v17-primitives.css` | CSS Custom Properties (primitivos + semânticos) |
| `/ds/v17/styles/ds-v17-legacy-aliases.css` | Bridge v16 → v17 |

---

## Módulos

- **`/cadastro/cliente/`** — ativo. Wizard de onboarding 6 passos (single file).
- **`/torre-de-controle/`** — ativo. Cockpit operacional — SMs em tempo real, KPIs, mapa, painel de gestão.
- **`/frota/`** — placeholder. Gestão de veículos/motoristas. Não iniciado.
- **`/ds/v17/`** — tokens, CSS e showcase compartilhados por todos os módulos.

---

## Princípios do DS v17

- **Nomenclatura DTCG W3C-compliant** (`--bg-surface`, `--text-default`, `--border-focus`)
- **Duas camadas de tokens** — primitivos (`--gray-*`, `--trouw-*`) + semânticos (`--bg-*`, `--text-*`)
- **Dois modos de densidade**: `form` (default, 11–24px) e `ops` via `[data-density="ops"]` (8–21px)
- **Fonte canônica**: Plus Jakarta Sans + `tabular-nums` em números
- **WCAG 2.2 AA** — foco visível, área de toque ≥ 24px, `prefers-reduced-motion`
- **`--t4` removido** (falhava contraste 1.67:1); aliases v16 em `legacy-aliases.css` mantêm retrocompatibilidade até v18

---

## Rodando local

Qualquer servidor estático serve. Dois atalhos:

```bash
# Node
npx serve . --listen 4317

# Python 3
python -m http.server 3000
```

Abra `http://localhost:4317/cadastro/cliente/` (ou a porta que escolher).

---

## Deploy

### Vercel (recomendado)

1. `git push` pro GitHub
2. "Import Project" no Vercel, aponte pro repo
3. Framework preset: **Other** · Build command: **vazio** · Output directory: **.**
4. Deploy. Pronto.

`vercel.json` já aplica:
- `cleanUrls: true` → rotas sem `.html`
- Cache de `/ds/v17/styles/` e `/ds/v17/tokens-v17.json` por 1h

---

## Backlog

- Migração progressiva da Torre de Controle para tokens v17 (bridge legacy-aliases ativo)
- Início do módulo Frota
- Auditoria de contraste automatizada em CI (`axe-core` ou Pa11y)
- Pipeline Tokens Studio → Style Dictionary (quando houver codebase consumidor)

---

**Stack:** HTML/CSS/JS puro · Plus Jakarta Sans · Font Awesome 6 · Zero build-step  
**DS:** v17.0.0 · 2026-04-15
