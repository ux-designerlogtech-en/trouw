# Trouw Play — Especificação funcional

**Versão:** 2026-04-20 · **Status:** parcialmente implementado (ver "Estado atual")

---

## 1. Propósito

Trouw Play é o **manual interativo** da plataforma Trouw. Substitui PDFs estáticos e vídeos longos por um **guia visual, clicável e versionável** que mostra, tela por tela, como usar cada recurso dos produtos Trouw (App Motorista, App Gestor, Portal Backoffice, etc.).

**Problema que resolve:**
- Onboarding de motoristas/usuários finais demorado e inconsistente
- Manuais em PDF ficam desatualizados rápido e ninguém lê
- Suporte repete a mesma explicação dezenas de vezes por dia
- Release notes de novas features não chegam de forma visual ao usuário final

**Como resolve:**
- Editor visual drag-and-pin onde o PO/UX monta o fluxo em minutos sem código
- Publicação imediata com link compartilhável
- Distribuição direta via WhatsApp pros motoristas
- Versionamento no Supabase (toda edição persiste em tempo real)

---

## 2. Personas

### 2.1 Editor (PO / UX / funcionária de cadastro)
Monta os fluxos. Acesso ao editor completo em `/trouw-play`. Conhece os produtos Trouw a fundo.

**O que precisa fazer:**
- Criar soluções (ex: "App Motorista") e fluxos dentro delas (ex: "Primeiro acesso — CPF")
- Subir prints/telas, marcar pontos (pins) sobre a imagem com orientação
- Escrever título, descrição e regra de atenção em cada passo
- Reordenar telas, excluir passos, editar a qualquer momento
- Salvar (rascunho) vs Publicar (visível ao motorista)
- Compartilhar no WhatsApp com um clique

### 2.2 Usuário final (motorista, gestor, backoffice)
Consome o manual. Não tem login, não edita nada. Recebe link por WhatsApp.

**O que precisa fazer:**
- Abrir o link no celular
- Ver o manual tela por tela, marcar como concluído
- Voltar/avançar livremente, inclusive pular pra um passo específico
- Ver tudo de uma vez quando quiser revisão rápida

---

## 3. Modelo de dados

Hierarquia em 4 níveis:

```
Solução (App Motorista)
 └── Fluxo (Primeiro acesso — CPF) · status: rascunho | pendente | publicado
      └── Tela (imagem/print)
           └── Passo (pin sobre a tela com x,y,título,desc,regra)
```

**Campos relevantes:**

| Entidade | Campo | Tipo | Obs |
|---|---|---|---|
| Solução | `id`, `name`, `icon` | string | `icon` é classe FontAwesome |
| Fluxo | `id`, `nome`, `caminho`, `contexto`, `status` | string | `status`: rascunho/pendente/publicado |
| Fluxo | `lastSavedAt`, `lastPublishedAt` | ISO date | usado no Publicar All |
| Tela | `id`, `name`, `img`, `steps[]` | | `img` é data-URL base64 |
| Passo | `id`, `x`, `y`, `title`, `desc`, `rule` | | `x/y` em %; `rule` é alerta amarelo opcional |

**Persistência:** single-table Supabase `app_state (id, state jsonb)` com o estado inteiro em uma linha. Autosave a cada 2s via snapshot-diff (compara `JSON.stringify`).

---

## 4. Editor — especificação funcional

### 4.1 Sidebar (lado esquerdo)

- **Soluções** colapsáveis (chevron), cada uma com contador de fluxos
- **Fluxos** dentro da solução:
  - Ícone `fa-diagram-project` + dot de status (verde publicado, amber rascunho) + nome + badge pub/rascunho
  - Hover revela botão lixeira → `deleteFlow` com confirmação (conta telas e passos que serão apagados)
  - Clique no fluxo ativo: toggle abre/fecha lista de telas
  - Clique em fluxo inativo: seleciona + abre
- **Telas** dentro do fluxo:
  - Handle drag (`fa-grip-vertical`, aparece no hover) para reordenar
  - Thumb (imagem ou ícone `fa-display`) + nome + contador de passos
  - Hover revela lixeira → `deleteScreen` com confirmação
  - Drag-and-drop nativo HTML5 com indicador visual (border-top/bottom azul)
- **Footer da sidebar:**
  - Linha 1: 3 botões fontscale (A/A/A) + 2 botões tema (☀/☾), tudo ícone-only 24×24
  - Linha 2 (separada por divider): avatar do editor + nome

### 4.2 Topbar (topo)

- Logo pin + texto "Trouw Play" em azul + badge "Beta"
- Breadcrumb: Solução › Fluxo › Tela N
- Botão **Simular** (ghost) — abre overlay de preview
- Botão **Publicar** (primary) — toggle rascunho↔publicado

### 4.3 Canvas central

- Barra de tela: chips com número de cada tela, `+ Tela` pra adicionar, drag-to-reorder (idem sidebar)
- Área da tela: imagem em contêiner fixo de 70vh; pins são círculos azuis numerados posicionados em `x%,y%`
- Clique no canvas: cria um novo pin na posição clicada
- Clique em pin existente: seleciona e destaca no painel direito

### 4.4 Painel direito — aba Geral

Campos editáveis do fluxo:
- Nome, Caminho (breadcrumb do produto), Contexto (descrição)
- Status visível ao usuário final (badge clicável alterna)

### 4.5 Painel direito — aba Passos

Lista de passos da tela ativa:
- Cada passo: número, título, desc, regra (amarelo), botão excluir
- Editar inline (sem modal); auto-salva
- `+ Adicionar passo` manual (sem pin) — útil pra instruções de contexto

### 4.6 Modais

- **Nova solução** — só nome
- **Novo fluxo** — nome (contexto preenche depois na aba Geral)
- **Upload telas** — multi-upload drag-and-drop ou seletor, ordem = ordem do upload

---

## 5. Modo Simular (preview)

Overlay fullscreen sobre o editor. Motorista vê exatamente isso (menos a barra de modo/fechar).

### 5.1 Modo "Passo a passo" (default)

Layout 3 colunas:
- **Esquerda (300px):** lista vertical de todos os passos da tela atual; atual destacado em azul, anteriores com número verde, clicáveis pra pular
- **Centro (flex):** canvas com a imagem + pins numerados (atual azul brilhante, anteriores verde, futuros cinza)
- **Direita (268px):** card do passo atual com número, título, descrição, regra, botões Anterior/Próximo

Navegação:
- Avançar passo → próximo pin na mesma tela
- No último passo da tela → botão vira "Próxima tela"
- No último passo da última tela → "Concluir"
- Dots embaixo do canvas pra pular pra qualquer passo

### 5.2 Modo "Ver tudo"

Layout scroll vertical, cada tela é um bloco:
- Header da tela (número + nome)
- Canvas com todos os pins marcados (todos verdes — referência visual)
- Ao lado: lista de todos os passos daquela tela com título/desc/regra

Usado pra revisão rápida ou impressão.

### 5.3 Acessibilidade

- 3 tamanhos de fonte (sm/md/lg) via `data-fontscale` no `<html>` — persiste em `localStorage`
- Dark/Light via `data-theme` — idem
- `prefers-reduced-motion` respeitado
- Área mínima de toque 24px (WCAG 2.2 AA)

---

## 6. Publicação (pendente — a implementar)

### 6.1 Status dos fluxos

Três estados:
- **rascunho** — em edição, nunca foi publicado (amber)
- **pendente** — foi marcado como "Salvo" hoje, mas ainda não foi publicado (azul)
- **publicado** — visível ao usuário final (verde)

### 6.2 Botão Salvar

No topbar, ao lado de Publicar:
- Marca o fluxo como `pendente` — indica "editei hoje, está pronto pra ir"
- Não torna visível ao motorista ainda
- Atualiza `lastSavedAt`
- Permite usar **Publicar All** no fim do dia pra empurrar tudo junto

### 6.3 Botão Publicar (individual)

Toggle atual: rascunho/pendente → publicado, ou publicado → rascunho (despublicar).

### 6.4 Publicar All

Ação global no topbar:
- Lista todos os fluxos com status `pendente` editados hoje (`lastSavedAt` >= início do dia)
- Modal de confirmação mostrando a lista
- "Publicar X fluxos" → promove todos pra `publicado`, atualiza `lastPublishedAt`

---

## 7. Distribuição (pendente — a implementar)

### 7.1 Rota pública `/play/:flowId`

Mesmo `index.html`, mas com query param `?viewer=1` ou rota dedicada que:
- Esconde sidebar, topbar, editor, aba Geral/Passos
- Abre direto em modo Simular
- Header fino: logo Trouw + título do fluxo + contexto
- Responsive mobile-first:
  - Desktop: 3 colunas como hoje
  - Tablet: canvas cheio + lista de passos colapsável
  - Mobile: canvas no topo, lista vertical embaixo
- Só fluxos com status `publicado` são acessíveis; outros retornam 404-like message

### 7.2 Compartilhamento

Botão **Compartilhar** no topbar do editor abre popover com:
- URL direta (input com botão "Copiar")
- Botão "Enviar no WhatsApp" → abre `https://wa.me/?text=<msg+link>` pré-preenchido:
  > 📱 Novo manual disponível: *<nome do fluxo>*
  > <contexto curto>
  > Veja como fazer: <url>
- (Futuro) QR code pra escanear

### 7.3 Segurança

- Link público, sem login. Adequado pra manual de operação.
- Dados sensíveis nos prints (nomes, CPFs) — responsabilidade do editor ao subir telas. Eventualmente: validação/mascara automática.
- Editor (`/trouw-play`) protegido por autenticação Supabase (pendente — hoje qualquer um com URL acessa).

---

## 8. Arquitetura técnica

**Stack:**
- HTML/CSS/JS puro, zero build-step
- Font Awesome 6 (CDN) · Plus Jakarta Sans (Google Fonts)
- Trouw DS v17 (tokens DTCG W3C)
- Supabase JS SDK v2 (UMD via CDN)

**Persistência:**
- Supabase Postgres, tabela `app_state (id text primary key, state jsonb, updated_at timestamptz)`
- Row Level Security com policy permissiva (Sprint 1) — revisar antes de abrir editor a terceiros
- Autosave: snapshot do `db` a cada 2s, compara com último salvo via `JSON.stringify`, só chama `upsert` se diferente

**Deploy:**
- GitHub → Vercel (auto-deploy on push to main)
- `vercel.json` com `cleanUrls: true`, `trailingSlash: false`
- Domínio: `trouw-ruddy.vercel.app` (módulo em `/trouw-play`)

**Imagens:**
- Armazenadas como base64 dentro do JSON — simples mas pesa se escalar muito
- **Roadmap:** migrar pra Supabase Storage quando `app_state.state` passar de ~500KB

---

## 9. Estado atual (2026-04-20)

**Implementado:**
- ✅ Editor completo (soluções, fluxos, telas, pins, passos)
- ✅ Autosave Supabase 2s
- ✅ Excluir telas e fluxos com confirmação cascata
- ✅ Drag-and-drop de telas dentro do fluxo
- ✅ Toggle expand/colapso de fluxos
- ✅ Modo Simular passo a passo (lista vertical esquerda + canvas + card)
- ✅ Modo Simular "Ver tudo"
- ✅ Fontscale + Dark/Light (no footer da sidebar)
- ✅ Deploy Vercel funcionando

**Pendente (backlog priorizado):**
1. ⏳ Botão Salvar (rascunho → pendente)
2. ⏳ Publicar All (todos os pendentes do dia)
3. ⏳ Rota pública `/play/:flowId` (viewer mode, sem editor)
4. ⏳ Botão Compartilhar + integração WhatsApp (wa.me)
5. ⏳ Polish mobile do viewer
6. ⏳ Autenticação no editor (Supabase Auth)
7. 💭 Métricas (quantos viram, quem concluiu)
8. 💭 Storage separado pra imagens
9. 💭 WhatsApp Business API (disparo automático ao publicar)

---

## 10. Decisões de produto

| Decisão | Escolha | Motivo |
|---|---|---|
| Single-file HTML | Sim | Velocidade de iteração, zero build |
| Persistência | Supabase JSONB single-row | Menor refactor do in-memory original |
| Auth | Nenhuma no viewer; pendente no editor | MVP primeiro; fluxos são manual, não sensível |
| Distribuição | Link público + wa.me manual | Fricção zero; upgrade pra Business API só com tração |
| Publicação | Rascunho → Pendente → Publicado | Permite editar vários no dia e empurrar tudo junto à noite |
| DS | Trouw DS v17 | Consistência com resto da plataforma |
| Estrutura | Soluções > Fluxos > Telas > Passos | Reflete como o cliente pensa: produto > feature > tela > instrução |

---

## 11. Glossário

- **Solução** — um produto ou módulo Trouw (App Motorista, Portal Backoffice, etc.)
- **Fluxo** — uma jornada de uso dentro da solução (Primeiro acesso, Cadastrar veículo, etc.)
- **Tela** — uma imagem/print que representa um estado da UI do produto
- **Passo (ou Pin)** — um ponto marcado sobre a tela com orientação pontual
- **Simular** — modo de preview que o editor usa para testar antes de publicar
- **Viewer** — modo de visualização pública que o usuário final recebe via link
