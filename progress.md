# progress.md

**Tarefa:** construir o "Game Pass ou Comprar?" (web, BR/US) a partir do PRD, com olhar crítico; mesmo harness do Archy (ver `CLAUDE.md`).

**Saídas:**
- `CLAUDE.md` — forma de trabalho
- `docs/prd-review.md` — revisão crítica, decisões e escopo proposto
- `scripts/phase0_probe.py` → `docs/phase0-probe.txt` — sonda de Fase 0 (sigls, busca, preços, inclusão, capas, planos)
- `game-pass-ou-comprar-prd.md` — PRD original (intocado)

**Concluído (2026-10-09):**
- Sondagem inicial de Fase 0: catálogo Game Pass (sigls), busca (autosuggest), preços regionais, inclusão por plano, desconto de assinante e preços de plano — resultados em `docs/prd-review.md` §1.
- Revisão crítica do PRD escrita; revisada pelo Codex (5 checks reprovados na 1ª versão; correções aplicadas: fórmula de equilíbrio com desconto de assinante, dupla contagem no "Assinar e manter", bundles multi-jogo, recálculo de link no servidor, alertas de sync, evidência do §1).

**Decisões:** propostas em `docs/prd-review.md` §2–4; **D1 (fonte não documentada) e D2 (nome/domínio) aguardam o usuário.**

**Pendências:** Fase 0 `docs/prd-review.md` §6 (Essential, preços oficiais dos planos, 30 jogos, preço ausente do CoD, filtro de DLC).

**Próxima ação:** com o ok em D1, fechar Fase 0 (`docs/phase0.md`) e começar o motor de cálculo com Vitest.
