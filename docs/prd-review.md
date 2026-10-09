# Revisão crítica do PRD — o que manter, cortar e corrigir

Data: 2026-10-09 · Base: `game-pass-ou-comprar-prd.md` v1.0 + sondagem real dos endpoints (Fase 0, ver §1).

**Resumo:** o núcleo do PRD está certo ("catálogo visual + carrinho de intenção + comparação instantânea") e as regras de honestidade (nunca preço zero, comparação parcial, sem conversão cambial, centavos inteiros) são boas e ficam. Mas ele (a) pede uma fonte "autorizada" que não existe para um projeto indie, (b) tem um erro na fórmula de ponto de equilíbrio, (c) define o cenário híbrido de forma que quase sempre empata com "Assinar", e (d) traz infraestrutura de produto grande (10 tabelas, links persistidos, Sentry, índice próprio do catálogo inteiro) para um MVP sem usuários.

---

## 1. Fase 0 já rodada — o que os dados mostram

Sondagem feita em 2026-10-09. Script: `scripts/phase0_probe.py`; saída bruta: `docs/phase0-probe.txt` (cada linha da tabela abaixo é verificável lá).

| Pergunta | Resultado | Evidência |
|---|---|---|
| Existe lista estruturada do catálogo Game Pass por mercado? | **Sim.** `catalog.gamepass.com/sigls/v2` | Console: 625 (US) / 613 (BR); PC: 521 / 519 |
| Busca por nome com edições? | **Sim.** `displaycatalog…/productFamilies/autosuggest` | "forza" em BR → Standard, Deluxe, Premium, Ultimate de FH5/FM/FH4, com IDs |
| Preço regional nativo (sem câmbio)? | **Sim**, BRL e USD reais por edição | FH5 Padrão: R$ 249,00 / US$ 59,99; Deluxe: R$ 309,00 / US$ 79,99 |
| Inclusão no Game Pass por produto? | **Sim, estruturado** (availabilities com remediação `Upsell` e preço 0) | FH5, Forza Motorsport, Starfield → PC GP + Premium; CoD BO6 (Windows) → nenhuma |
| Desconto de assinante? | **Sim** | FH5 Deluxe: R$ 309,00 → R$ 247,20 (−20%) para assinante |
| Preço ausente? | **Acontece** | CoD BO6 (Windows) volta sem nenhum preço de compra em BR e US → caso real de "comparação parcial" |
| Capas? | **Sim**, várias proporções (BoxArt, Poster, etc.) no CDN `store-images.s-microsoft.com` | resposta do `displaycatalog` |
| Preço dos planos? | **Bagunçado.** Mistura SKUs de teste, promo ("2 meses por US$ 2"), legado ("Game Pass para Console") e possivelmente preços defasados | Ultimate US aparece a US$ 22,99 — precisa conferir em xbox.com |

**Conclusão:** os dados necessários existem, cobrem BR e US e são melhores do que o PRD supõe (inclusive desconto de assinante). Mas vêm de **endpoints não documentados** da Microsoft. Não há API pública autorizada de catálogo/preço Xbox; todos os rastreadores conhecidos usam esses mesmos endpoints.

## 2. Decisões que mudam o PRD

### D1 — Fonte de dados (bloqueadora; precisa do seu ok)
O PRD exige fonte "autorizada" antes do lançamento (§9.1, Fase 0). Na prática, isso é impossível sem parceria com a Microsoft. Proposta: **usar os endpoints públicos não documentados**, com mitigação:
- só o job de sync e o cache do servidor falam com a Microsoft (baixa frequência, nunca por tecla, nunca do navegador);
- capas carregadas do CDN da Microsoft (sem re-hospedar), link para a loja oficial em cada item;
- aviso "não afiliado à Microsoft/Xbox" e data de verificação em cada preço;
- se algo quebrar, o produto mostra último dado marcado como desatualizado (regra do PRD que fica).

Risco residual: a Microsoft muda ou bloqueia os endpoints. Aceitável para MVP gratuito, mas é **decisão sua**.

### D2 — Nome e domínio
"Game Pass" e "Xbox" são marcas da Microsoft. Nome/domínio com "gamepass" pode gerar pedido de remoção. Sugiro nome próprio + descrição ("Vale a pena assinar ou comprar?"). Decidir antes de registrar domínio.

### D3 — Planos são dados curados, não sincronizados
Os SKUs de plano do catálogo não são confiáveis o bastante. Tabela `plans` curada à mão (Essential, Premium, Ultimate, PC Game Pass × BR/US), com data de verificação e fonte (xbox.com). O sync só **alerta** se o preço do catálogo divergir. O plano legado "Game Pass para Console" fica fora.

### D4 — Inclusão por plano
O `displaycatalog` mostra Premium e PC Game Pass; Ultimate não aparece como remediação (é superconjunto). Regra proposta: Ultimate inclui tudo das listas *sigls* "All Console/PC"; Premium/PC conforme remediação; Essential precisa de lista própria — **pendente** (ver §5). Lançamentos "day one" só no Ultimate precisam de checagem extra.

## 3. Correções de lógica

### C1 — Ponto de equilíbrio está errado
PRD §8.7: `meses = C_compra / preço_mensal`. Isso ignora que jogos fora do plano são comprados nos **dois** cenários. Correto:

```text
meses_equilíbrio = (C_compra − soma(preço de ASSINANTE dos jogos fora do plano)) / preço_mensal
                 = (soma(incluídos) + economia de assinante nos jogos fora) / preço_mensal
```
(sobre itens não possuídos; sem desconto de assinante, reduz a `soma(incluídos) / mensal`). Com ciclos não mensais o motor usa a série real de custos, como o próprio PRD sugere. *Fórmula corrigida após revisão do Codex — a primeira versão omitia a economia de assinante.*

### C2 — Cenário híbrido mal definido
No PRD, "Assinar" já inclui comprar os jogos fora do plano; "Híbrido" = isso + jogos marcados para "manter". Sem nenhum item marcado, híbrido = assinar. Proposta de 2 cenários + 1 variação que realmente informa:
- **Comprar tudo** — soma das edições, preço vigente.
- **Assinar N meses** — plano × N + jogos fora do plano **com desconto de assinante** (comprados enquanto assinante).
- **Assinar e manter** (só aparece se houver itens "quero manter") — o anterior + compra, com desconto de assinante, apenas dos itens marcados que estão **incluídos** no plano (os fora do plano já foram comprados; possuídos ficam fora). Sem isso haveria dupla contagem.

A informação mais útil para o usuário é "quantos meses de assinatura empatam com comprar" — destaque principal da tela.

### C3 — Edições premium e assinatura
O Game Pass costuma incluir só a edição padrão. Se o usuário escolhe Deluxe, o cenário assinatura precisa de "upgrade" (pacote de complementos) — o catálogo tem esses bundles (ex.: "Pacote de Complementos Supremo do FH5"), mas casar edição↔upgrade é frágil. **Decisão do MVP (2026-10-09, após revisão do Codex):** a comparação é sobre a edição que o usuário escolheu. Se ele quer a Deluxe e o plano não a inclui, no cenário assinatura ele compra a Deluxe (com desconto de assinante daquele plano, se houver) — custo completo e honesto para esse desejo. Como o catálogo não liga edição superior ↔ padrão com segurança, o item recebe um **aviso** ("o Game Pass costuma incluir só a edição padrão") em vez de virar comparação parcial; quem quiser só jogar troca para a edição padrão, que mostra "No Game Pass". Casar pacote de upgrade fica para depois.

## 4. Cortes de escopo (simplificar sem perder o núcleo)

| PRD | Proposta | Por quê |
|---|---|---|
| Links compartilháveis persistidos (`shared_comparisons`, `POST/GET /api/share`, retenção, expiração) | **Estado codificado na URL** (`/br?p=9NKX70BBCDRN,9P1HX37NMJLT&plan=ultimate&m=6&own=…`) | Zero banco, zero política de retenção, revalidação é automática. Total antigo no link serve só como **dica não confiável** ("o total era X quando o link foi criado"), nunca entra no cálculo. Limite de itens por link (ex.: 40) para caber na URL. |
| 10 tabelas (games, localizations, editions, components, store_products, offers…) | ~5: `products` (uma linha por edição, com `family`/título e `includes_product_ids[]`), `offers` (produto × mercado), `price_history` (só quando muda), `plans`, `plan_inclusions` | O ID da loja já identifica a edição; "jogo conceitual" vira agrupamento por família. Regra "uma edição por jogo no carrinho" + array de componentes para bundles multi-jogo (detecta dupla contagem sem tabela própria). |
| Índice local (FTS + trigram) do catálogo inteiro | Índice local do que conhecemos (catálogo Game Pass ~600 + produtos já buscados/populares) **+** fallback para o autosuggest da Microsoft via servidor com cache de borda | Não há endpoint para listar o catálogo Xbox inteiro. |
| Horas por semana, duração de campanha, "só meses que vou jogar" (RF-08) | Fora do MVP | O próprio PRD diz que depende de fonte licenciada (Fase 4). |
| Sentry desde o início | Tabela `sync_runs` com status por mercado + **alerta por e-mail** quando o sync falha ou preços passam do limite de atualidade | Volume baixo; adicionar Sentry quando houver tráfego. Logs sozinhos não alertam ninguém. |
| Filtros (Series/One/PC/lançamento/promo) | Só "no Game Pass" e plataforma (Console/PC) | O resto é ruído no MVP. |
| `POST /api/compare` no servidor | Motor em TypeScript puro, **mesmo código** no cliente e no servidor; ao abrir um link compartilhado, o servidor recalcula na renderização com preços atuais | Evita duas implementações e mantém o recálculo confiável do PRD; o cliente nunca envia preço. |

Mantidos sem alteração: BR/US com `/br` e `/us`, idioma independente do país, geolocalização por header da Vercel (`x-vercel-ip-country`), centavos inteiros, comparação parcial, nunca preço zero, aviso de sales tax nos EUA, sem cadastro, carrinho em `localStorage`, acessibilidade e SEO básico.

## 5. Riscos não cobertos pelo PRD (apontados na revisão do Codex, aceitos)
- **Desconto de assinante** varia por produto, plano e período e pode expirar; tratar como preço com validade, igual promoção.
- **Saída do catálogo durante os N meses**: o cálculo assume o catálogo de hoje; mostrar data de saída quando conhecida ("sai em breve") e avisar a premissa.
- **Agrupamento por família** pode colidir (remasters, coletâneas); usar o `ProductFamily`/título da loja e permitir troca manual de edição.
- **Link adulterado**: só IDs e opções são lidos; tudo é revalidado no servidor.

## 6. Pendências de Fase 0 (antes de construir a UI)
1. Lista de inclusão do **Essential** e confirmação de que Ultimate = sigls "All".
2. Preços oficiais dos 4 planos em BR e US (xbox.com) — fonte para a tabela curada.
3. Conjunto de ~30 jogos (PRD §16.4) rodado pelo script: edições, bundles, F2P, pré-venda, DLC, exclusivo de um mercado. Registrar divergências em `docs/phase0.md`.
4. Preço ausente (ex.: CoD BO6 Windows): entender se é produto sem venda avulsa ou outro tipo de availability.
5. Classificação produto-jogo vs DLC/moeda/complemento: o autosuggest marca tudo como "Game" (o pacote de complementos do FH5 veio como Game) → precisa de heurística com `ProductKind`/`Properties`.

## 7. Ordem de construção proposta
1. **Fase 0 fechada** (itens do §6) → `docs/phase0.md`.
2. **Motor de cálculo** (TS puro + Vitest) com os casos do PRD §16.1 — testável sem UI e sem banco.
3. **Sync** (script/cron) → Supabase (projeto novo, separado do Archy/Onde Foi).
4. **App Next.js**: busca → carrinho → comparação, BR/US.
5. Deploy de preview na Vercel (com seu ok), teste com 3–5 pessoas, depois domínio.

Stack do PRD mantida (Next.js App Router, TS, Tailwind + shadcn/ui, Zustand, Supabase, Vercel Cron, next-intl, Vitest + Playwright), exceto Sentry adiado.
