# Torre de Controle

> **Status:** placeholder · roadmap  
> **Última ref:** Torre Operacional v2_85 (HTML + DS v16 legado)

Cockpit operacional da logística Trouw. Painel de SLAs, ocorrências, embarques em tempo real, dashboards Tableau embutidos.

## Por que esta pasta existe hoje

A implementação atual vive fora deste monorepo. Esta pasta está reservada para a migração para **DS v17** (tokens DTCG-W3C, Plus Jakarta Sans, dois modos de densidade). Quando a migração começar, os arquivos virão para cá e o hub raiz (`/`) passa a apontar para `/torre-de-controle/`.

## Próximos passos

- [ ] Migrar v2_85 do diretório externo
- [ ] Trocar tokens `--neutral-*` → `--gray-*` via legacy-aliases
- [ ] Re-validar contraste WCAG 2.2 AA
- [ ] Adotar `[data-density="ops"]` como default (é produto de alta densidade)

## Referências

- Design System: `/ds/v17/`
- Showcase: `/cadastro/cliente/docs/showcase-v17`
- Memória do projeto: `memory/project_state_torre.md`
