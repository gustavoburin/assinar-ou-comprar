# Assinar ou Comprar?

Monte a lista dos jogos de Xbox que você quer jogar e veja se sai mais barato **comprar** ou **assinar o Game Pass**, com preços reais da Microsoft Store do Brasil (R$) e dos EUA (US$).

**No ar:** https://assinar-ou-comprar.vercel.app

## O que faz
- Busca de jogos (inclusive lançamentos), com capa, edição, preço vigente, promoção e preço de assinante.
- Lista de intenção com "já tenho" e "quero manter", salva no navegador.
- Compara **Comprar tudo**, **Assinar N meses** (jogos fora do plano comprados com o desconto de assinante do plano) e **Assinar e manter**; mostra economia e até quantos meses a assinatura compensa.
- Planos: Game Pass Ultimate, Premium e PC Game Pass; console ou PC; 1 a 36 meses.
- Nunca trata preço desconhecido como zero: mostra **comparação parcial**, sem vencedor.
- Link compartilhável (estado na URL, preços revalidados ao abrir).

## Como funciona
- `web/` — Next.js 16 (App Router, Cache Components), Tailwind, Zustand, Vitest. Deploy na Vercel.
- Dados de endpoints públicos **não documentados** da Microsoft (busca e destaques do xbox.com, `displaycatalog` para preço/inclusão, listas do Game Pass), sempre pelo servidor e com cache. Preços dos planos curados em `web/src/lib/plans.ts`.
- Motor de cálculo puro e testado: `web/src/lib/engine.ts`.

```bash
cd web
npm install
npm test
npm run dev
```

## Documentos
- `game-pass-ou-comprar-prd.md` — especificação original.
- `docs/prd-review.md` — revisão crítica e escopo adotado (prevalece sobre o PRD).
- `checks.md` / `progress.md` — requisitos verificados e estado do projeto.

## Aviso
Projeto independente, sem afiliação com a Microsoft ou o Xbox. Xbox e Game Pass são marcas da Microsoft. Os dados podem mudar ou ficar indisponíveis; confira o preço na loja antes de comprar.
