# progress.md

**Tarefa:** MVP do comparador "Assinar ou Comprar?" (Game Pass x compra, BR/US), escopo em `docs/prd-review.md`. Usuário aprovou (2026-10-09): usar endpoints não documentados da Microsoft, nome próprio, deploy em URL da Vercel sem domínio.

**Saídas:**
- Produção: https://assinar-ou-comprar.vercel.app (projeto Vercel `assinar-ou-comprar`, time `burin1`, separado de Archy/Onde Foi)
- `web/` — app Next.js 16 (App Router, Cache Components, Tailwind 4, Zustand, Vitest)
  - `web/src/lib/engine.ts` — motor de comparação (+ `engine.test.ts`)
  - `web/src/lib/xbox.ts` — leitura/parse da Microsoft Store e listas Game Pass (+ `xbox.test.ts`, fixtures reais em `__fixtures__/`)
  - `web/src/lib/catalog.ts` — cache `use cache: remote` (horas); rotas `web/src/app/api/{search,products,featured}` com `s-maxage`
  - `web/src/lib/plans.ts` — planos curados (conferidos em xbox.com em 2026-10-09)
  - `web/src/components/App.tsx` — UI (busca, carrinho, comparação, link compartilhado)
  - `web/src/proxy.ts` — `/` → `/br` ou `/us` (cookie > `x-vercel-ip-country` > seletor)
- `checks.md` — requisitos x evidência
- `docs/prd-review.md`, `docs/phase0-probe.txt`, `scripts/phase0_probe.py`, `game-pass-ou-comprar-prd.md` (original)

**Concluído (2026-10-09):**
- Revisão crítica do PRD (revisada pelo Codex, correções aplicadas).
- Fase 0: inclusão por plano mapeada em 818 produtos (Premium/PC via remediação; Ultimate = listas sigls; EA Play e Ubisoft+ só Ultimate). Essential sem lista pública → fora. Preços dos planos conferidos em xbox.com.
- MVP construído: testes passando, lint/tsc/build ok, verificado no navegador (desktop, celular, BR→US, link compartilhado, comparação parcial).
- Bug achado no navegador e corrigido: SKU de avaliação grátis virava preço 0 (33 Immortals).
- Revisão do Codex sobre `web/`: 9 de 10 achados confirmados e corrigidos (ver `checks.md`); 31/31 testes; redeploy verificado em produção.
- 2026-10-10 — feedback do usuário: jogos atuais (Gears of War: E-Day, Halo: Campaign Evolved, Forza Horizon 6) não apareciam. Causa: autosuggest da Microsoft limita a 10 resultados e a tela inicial era a lista do Game Pass em ordem alfabética. Correção: busca e destaques passam a usar a busca/“Procurar jogos” do xbox.com (até 25, por relevância, só jogos), com preços ainda do displaycatalog; páginas hub e upgrades escondidos; retry em 5xx e cache curto quando cai no fallback. Verificado em produção BR/US: E-Day 1º em "gears of war", Campaign Evolved 2º em "halo", FH6 1º em "forza horizon"; 37/37 testes.
- Deploy de produção; CDN confirmou `x-vercel-cache: HIT` na 2ª busca.

**Decisões:**
- Sem banco no MVP: Microsoft consultada só no servidor, com cache remoto + CDN. Sem histórico de preço/auditoria.
- Sem next-intl/shadcn/Sentry: dicionário próprio (`i18n.ts`) e Tailwind puro — 2 idiomas não justificam a dependência.
- Edição superior não incluída no plano conta como compra (com desconto de assinante).

**Pendências:**
- Essential; histórico de preços (Supabase); Playwright E2E; revisão WCAG formal; SEO de páginas de jogo.
- Heurística de DLC por título pode deixar passar casos.
- Busca depende do HTML do xbox.com (formato pode mudar): fallback automático para autosuggest, log `busca xbox.com falhou`. Vale um alerta se o fallback ficar frequente.
- "Forza Horizon Japan" não é título: o jogo se chama Forza Horizon 6 (busca por "forza horizon" acha).

**Próxima ação:** testar com 3–5 pessoas reais; depois decidir entre (a) Supabase para histórico de preços, (b) Playwright E2E, (c) lista do Essential.

## Procedimento: deploy
```
cd web && npm test && npm run build && npx vercel deploy --prod --yes
```
Depois: repetir `curl -sI "https://assinar-ou-comprar.vercel.app/api/search?market=BR&q=forza"` — a 2ª deve dar `x-vercel-cache: HIT`.
