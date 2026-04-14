# Torre de Controle — Cadastro de Cliente · DS v17

Vitrine técnica do **Trouw Design System v17** e do fluxo de **Cadastro de Cliente**.
HTML estático, sem build, sem dependências locais — pronto pra GitHub + Vercel.

---

## O que tem aqui

| Rota | Arquivo | Descrição |
|---|---|---|
| `/` | `index.html` | Hub com links pras páginas |
| `/cadastro/step-1-identificacao` | `cadastro/step-1-identificacao.html` | Wizard passo 1 — identificação, contrato, SLA, contato, filiais |
| `/cadastro/step-2-usuarios` | `cadastro/step-2-usuarios.html` | Wizard passo 2 — usuários, funções, permissões |
| `/docs/showcase-v17` | `docs/showcase-v17.html` | Showcase dos componentes novos (form patterns) |
| `/docs/showcase-v16` | `docs/showcase-v16.html` | Showcase v16 histórico (referência) |
| `/tokens/tokens-v17.json` | `tokens/tokens-v17.json` | Fonte canônica DTCG W3C 1.0 |
| `/styles/ds-v17-primitives.css` | `styles/ds-v17-primitives.css` | CSS Custom Properties (primitivos + semânticos) |
| `/styles/ds-v17-legacy-aliases.css` | `styles/ds-v17-legacy-aliases.css` | Bridge v16 → v17 |

---

## Estrutura

```
torre-cadastro-v17/
├── index.html
├── cadastro/
│   ├── step-1-identificacao.html
│   └── step-2-usuarios.html
├── docs/
│   ├── showcase-v17.html
│   └── showcase-v16.html
├── styles/
│   ├── ds-v17-primitives.css
│   └── ds-v17-legacy-aliases.css
├── tokens/
│   └── tokens-v17.json
├── vercel.json
└── README.md
```

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
# Python 3
python -m http.server 3000

# Node (http-server)
npx http-server . -p 3000 --cors
```

Abra `http://localhost:3000`.

---

## Deploy

### Vercel (recomendado)

1. `git push` pro GitHub
2. "Import Project" no Vercel, aponte pro repo
3. Framework preset: **Other** · Build command: **vazio** · Output directory: **.**
4. Deploy. Pronto.

`vercel.json` já aplica:
- `cleanUrls: true` → rotas sem `.html`
- Cache de `/styles/` e `/tokens/` por 1h

### GitHub Pages

Funciona, mas as rotas usarão `.html` no fim (cleanUrls é feature do Vercel). Se migrar pra Pages, ajuste os `<a href>` do `index.html` adicionando `.html`.

---

## Backlog

- Steps 3–6 do wizard (Operação, Integração, SLAs, Revisão)
- Auditoria de contraste automatizada em CI (`axe-core` ou Pa11y)
- Pipeline Tokens Studio → Style Dictionary (quando houver codebase consumidor)

---

**Stack:** HTML/CSS/JS puro · Plus Jakarta Sans · Font Awesome 6 · Zero build-step
**Versão:** 17.0.0 · 2026-04-14
