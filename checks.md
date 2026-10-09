# checks.md — MVP (2026-10-09)

Escopo: `docs/prd-review.md`. Produção: https://assinar-ou-comprar.vercel.app

| Requisito | Veredito | Evidência | Correção |
|---|---|---|---|
| Motor: comprar / assinar / assinar e manter, centavos inteiros | pass | `npm test` em `web/` → 31/31 (engine.test.ts, xbox.test.ts) | — |
| Equilíbrio com desconto de assinante | pass | engine.test.ts "ponto de equilíbrio considera…"; no navegador BR: (1157,99 − 647,19)/76,90 = 6,6 → "até 6 meses" | — |
| Preço desconhecido nunca vira 0; comparação parcial sem vencedor | pass | engine.test.ts; navegador: link com CoD BO6 → "⚠ Comparação parcial", sem "Mais barato" | — |
| SKU de avaliação não vira preço | pass | 33 Immortals aparecia "Free"; corrigido em xbox.ts (`IsTrial`), teste com fixture real `trial-br.json`; agora R$ 72,95 | corrigido |
| Busca incremental com debounce e cache | pass | App.tsx (250 ms); produção: 2ª busca `x-vercel-cache: HIT` | — |
| DLC/complementos fora dos resultados | pass (heurística) | xbox.test.ts `isMainGame`; "forza" não mostra "Pacote de Complementos" | heurística por título; pode deixar passar casos |
| Edições distintas, sem duplicar | pass | busca "forza" lista Standard/Deluxe/Premium; botão vira "✓ Adicionado"; teste "mesma edição duas vezes" | — |
| Já possuído / quero manter | pass | link compartilhado `.o`/`.k` restaurado; "assinar e manter" = 299,50 + 249,00 = 548,50 | — |
| Persistência local | pass | zustand persist `gpoc-v1`; carrinho mantido entre /br → /us e recarga | — |
| BR/US: preço nativo, sem conversão, URL /br e /us | pass | FH5: R$ 249,00 / US$ 59,99; troca de país manteve 3 itens e recalculou em USD | — |
| Detecção de mercado sem GPS | pass | produção: `/` → 307 `/br` (header `x-vercel-ip-country`); sem país → seletor | — |
| Aviso de sales tax nos EUA | pass | painel /us: "Sales tax may be added at checkout…" | — |
| Data de verificação dos preços | pass | "Preços da Microsoft Store verificados em 09/10/2026, 08:31" | — |
| Link compartilhável, revalidado | pass | `/br?i=…&plan=premium&pf=pc&m=5` restaurou tudo, limpou URL, buscou preços atuais | — |
| Celular | pass | 375×812: barra fixa com total, painel em tela cheia | — |
| Planos: Essential | fail (aceito) | lista de jogos não exposta; aviso no rodapé | fase seguinte |
| Histórico de preços / auditoria | unresolved | sem banco no MVP (decisão) | Supabase se o produto vingar |
| E2E Playwright, WCAG formal | unresolved | verificação manual no navegador apenas | próxima etapa |
| Revisão independente (Codex) | pass | `codex exec -s read-only` sobre web/: 10 achados; 9 confirmados e corrigidos, #8 (equilíbrio arredondado para baixo) rejeitado — "até 4 meses" é correto para 4,27 | ver linhas abaixo |
| Desconto de assinante por plano (Codex #1) | pass | FH5 Deluxe: `memberPrices {pc, ultimate}`, sem Premium; navegador Premium/console: 3×59,90 + 309,00 = R$ 488,70 | corrigido |
| Troca de mercado refaz produtos (Codex #2) | pass | `key={market}` + produto de outro mercado conta como ausente | corrigido |
| Edição superior (Codex #3) | pass (decisão) | aviso no item; C3 atualizado em docs/prd-review.md | corrigido |
| localStorage validado (Codex #4) | pass | store.test.ts `sanitizePersisted` | corrigido |
| Cache por produto + 400 em ids inválidos (Codex #5) | pass | produção: `ids=x` → 400 | corrigido |
| Premium pela remediação (Codex #6) | pass | xbox.test.ts (33 Immortals fora das listas → Premium console+pc) | corrigido |
| Retry após falha (Codex #7) | pass | App.tsx `failedKey` + botão "Tentar de novo" | corrigido |
| Link inválido não apaga lista (Codex #9) | pass | store.test.ts + navegador: `?i=XXXXXXXXXXXX-invalid` manteve 2 itens | corrigido |
| Foco do painel no celular (Codex #10) | pass | autoFocus no fechar, Escape, `inert` no fundo, foco volta ao botão | corrigido |
