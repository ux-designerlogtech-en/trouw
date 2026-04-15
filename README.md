# Trouw · Monorepo

Plataforma Trouw de logística B2B. Design System + módulos de produto, HTML estático, sem build-step, pronto pra GitHub + Vercel.

---

## Estrutura

```
trouw/
├── index.html                     ← hub do monorepo
├── ds/
│   └── v17/
│       ├── tokens-v17.json        ← fonte canônica DTCG W3C 1.0
│       └── styles/
│           ├── ds-v17-primitives.css
│           └── ds-v17-legacy-aliases.css   ← bridge v16 → v17
├── cadastro/
│   ├── README.md
│   └── cliente/                   ← módulo ativo
│       ├── index.html             ← hub do cadastro cliente
│       ├── steps/
│       │   ├── step-1-identificacao.html
│       │   ├── step-2-usuarios.html
│       │   ├── step-3-operacao.html
│       │   ├── step-4-integracao.html
│       │   ├── step-5-slas.html
│       │   └── step-6-revisao.html
│       └── docs/
│           ├── showcase-v17.html  ← showcase dos componentes v17
│           └── showcase-v16.html  ← showcase v16 histórico
├── torre-de-controle/             ← placeholder (roadmap)
│   └── README.md
├── frota/                         ← placeholder (roadmap)
│   └── README.md
├── vercel.json
└── README.md
```

---

## Rotas principais

| Rota | Descrição |
|---|---|
| `/` | Hub do monorepo — 4 cards de produtos Trouw |
| `/cadastro/cliente/` | Hub do cadastro de cliente |
| `/cadastro/cliente/steps/step-1-identificacao` | Wizard passo 1 — identificação, contrato, SLA, contato, filiais |
| `/cadastro/cliente/steps/step-2-usuarios` | Wizard passo 2 — usuários, funções, permissões |
| `/cadastro/cliente/steps/step-3-operacao` | Wizard passo 3 — modais, veículos, restrições, cobertura, janelas |
| `/cadastro/cliente/steps/step-4-integracao` | Wizard passo 4 — canal, webhooks, sincronização, teste de conexão |
| `/cadastro/cliente/steps/step-5-slas` | Wizard passo 5 — metas OTIF/OTD, penalidades, alertas, relatórios |
| `/cadastro/cliente/steps/step-6-revisao` | Wizard passo 6 — checklist, resumos, aceite, finalizar |
| `/cadastro/cliente/docs/showcase-v17` | Showcase dos componentes v17 (form patterns) |
| `/cadastro/cliente/docs/showcase-v16` | Showcase v16 histórico (referência) |
| `/ds/v17/tokens-v17.json` | Fonte canônica DTCG W3C 1.0 |
| `/ds/v17/styles/ds-v17-primitives.css` | CSS Custom Properties (primitivos + semânticos) |
| `/ds/v17/styles/ds-v17-legacy-aliases.css` | Bridge v16 → v17 |

---

## Módulos

- **`/cadastro/cliente/`** — ativo. Wizard de onboarding + showcase DS v17.
- **`/torre-de-controle/`** — placeholder. Cockpit operacional (ref: v2_85). Migração para v17 pendente.
- **`/frota/`** — placeholder. Gestão de veículos/motoristas. Não iniciado.
- **`/ds/v17/`** — tokens e CSSs compartilhados por todos os módulos.

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

Abra `http://localhost:4317` (ou a porta que escolher).

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

### GitHub Pages

Funciona, mas as rotas usarão `.html` no fim (cleanUrls é feature do Vercel). Se migrar pra Pages, ajuste os `<a href>` adicionando `.html`.

---

## Backlog

- Migração da Torre de Controle v2_85 para v17
- Início do módulo Frota
- Auditoria de contraste automatizada em CI (`axe-core` ou Pa11y)
- Pipeline Tokens Studio → Style Dictionary (quando houver codebase consumidor)
- Promover componentes novos (Switch, KPI Grid, Penalty Table, Summary Card, Webhook Table) do cadastro para o showcase v17

---

**Stack:** HTML/CSS/JS puro · Plus Jakarta Sans · Font Awesome 6 · Zero build-step  
**DS:** v17.0.0 · 2026-04-14
