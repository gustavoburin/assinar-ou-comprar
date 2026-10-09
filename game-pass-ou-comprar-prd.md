# Game Pass ou Comprar?

## Especificação de produto (PRD)

**Versão:** 1.0  
**Escopo inicial:** MVP para Brasil e Estados Unidos  
**Plataforma:** aplicação web responsiva  
**Status:** pronta para refinamento técnico e desenvolvimento

---

## 1. Resumo executivo

“Game Pass ou Comprar?” é uma aplicação web gratuita, responsiva e sem cadastro obrigatório que ajuda jogadores a decidir se é financeiramente mais vantajoso comprar os jogos desejados na Xbox Store ou acessá-los por meio de um plano Xbox Game Pass.

A experiência central deve ser simples:

> Pesquisar → visualizar → adicionar → comparar.

O usuário pesquisa jogos pelo nome, vê resultados com capas e dados da edição, adiciona produtos a um “carrinho” de comparação e acompanha o cálculo financeiro em tempo real. O carrinho não representa uma compra real: ele é uma lista de jogos que o usuário pretende jogar.

O MVP deve atender Brasil e Estados Unidos, com catálogo, preços, planos, idioma e moeda correspondentes ao mercado escolhido. Os preços devem ser obtidos de cada loja regional; não devem ser estimados por conversão cambial.

O produto deve considerar não apenas a soma dos preços, mas também:

- a edição específica de cada jogo;
- a disponibilidade de cada produto no plano selecionado;
- a plataforma ou dispositivo em que o usuário joga;
- o número de meses de assinatura;
- jogos não incluídos no plano;
- jogos que o usuário já possui;
- o interesse em revisitar jogos depois de concluí-los;
- a possibilidade de um jogo entrar ou sair do catálogo;
- preços promocionais e a validade das promoções;
- dados ausentes ou desatualizados.

O resultado deve ser determinístico, explicável e auditável. IA generativa não é necessária para a recomendação do MVP.

---

## 2. Objetivos do produto

### 2.1 Objetivo principal

Permitir que um visitante descubra, de forma rápida e confiável, qual alternativa custa menos para o conjunto de jogos que deseja jogar:

1. comprar todos os jogos;
2. assinar um plano Game Pass durante determinado período;
3. combinar assinatura e compra em um cenário híbrido.

### 2.2 Objetivos de experiência

- Eliminar a necessidade de preencher planilhas ou informar manualmente os preços.
- Tornar a seleção familiar, visual e semelhante à navegação por uma loja de jogos.
- Atualizar os cálculos automaticamente a cada mudança relevante.
- Explicar por que uma opção foi recomendada.
- Permitir testar outros mercados, planos, períodos e hábitos sem perder a seleção.
- Preservar a simulação localmente e permitir compartilhá-la por link.

### 2.3 Princípio central

A experiência deve parecer uma loja de jogos durante a escolha, mas funcionar como uma calculadora financeira durante a decisão.

---

## 3. Escopo

### 3.1 Incluído no MVP

- Aplicação web responsiva.
- Uso sem cadastro.
- Mercados Brasil e Estados Unidos.
- Idiomas iniciais `pt-BR` e `en-US`.
- Busca visual de jogos com capas.
- Seleção de edições específicas.
- Carrinho de comparação.
- Preços regionais da Xbox Store.
- Planos e preços regionais do Game Pass.
- Seleção do número de meses de assinatura.
- Verificação de disponibilidade por plano e plataforma.
- Comparação entre compra, assinatura e cenário híbrido.
- Identificação de jogos já possuídos.
- Persistência local da comparação.
- Links compartilháveis.
- Indicação da última atualização dos dados.
- Tratamento explícito de dados ausentes ou desatualizados.
- SEO localizado, acessibilidade, monitoramento e testes.

### 3.2 Fora do primeiro lançamento

- Contas de usuário.
- Integração com a conta Xbox ou Microsoft.
- Detecção automática dos jogos já comprados.
- Aplicativo nativo.
- Sistema social.
- Notificações push.
- Recomendações baseadas em IA generativa.
- Suporte a PlayStation, Nintendo ou Steam.
- Monetização como requisito de produto.

A arquitetura pode permitir expansões futuras, mas elas não devem atrasar a qualidade do comparador Xbox.

---

## 4. Usuários e necessidades

### 4.1 Usuário principal

Jogador de Xbox que tem uma lista de jogos de interesse e quer decidir se deve comprá-los ou assinar o Game Pass por um período.

### 4.2 Necessidades principais

- Encontrar rapidamente os jogos corretos e suas edições.
- Confiar que o preço corresponde ao país selecionado.
- Saber se os jogos estão incluídos no plano escolhido.
- Entender o custo ao longo do período em que pretende jogar.
- Considerar jogos que deseja manter ou revisitar.
- Experimentar cenários sem criar conta.
- Compartilhar a comparação com outras pessoas.

---

## 5. Jornada principal

1. O visitante abre o site.
2. O sistema resolve o mercado provável entre Brasil e Estados Unidos.
3. O site apresenta idioma, moeda, planos e catálogo correspondentes.
4. O visitante pesquisa por nome, franquia ou parte do título, por exemplo “Forza”.
5. Os resultados aparecem com capa, título, edição, plataforma, preço e disponibilidade no Game Pass.
6. O visitante adiciona uma edição ao carrinho de comparação.
7. O resumo financeiro é atualizado imediatamente.
8. O visitante adiciona outros jogos e pode remover, limpar ou marcar itens como já possuídos.
9. O visitante seleciona plano, dispositivo, meses de uso e, opcionalmente, hábitos e tempo disponível.
10. O sistema compara compra, assinatura e cenário híbrido.
11. O sistema apresenta a alternativa mais barata, a diferença monetária, o ponto de equilíbrio, as premissas e as limitações.
12. O visitante pode trocar o mercado, mantendo a seleção, ou compartilhar a simulação por link.

---

## 6. Experiência e requisitos funcionais

### RF-01 — Página inicial

A primeira tela deve apresentar a busca imediatamente, sem exigir cadastro, onboarding ou configuração obrigatória anterior.

Ela deve comunicar de forma clara:

- o propósito do produto;
- o mercado e a moeda em uso;
- como pesquisar e adicionar jogos;
- o estado atual da comparação;
- como mudar país ou idioma.

Quando o carrinho estiver vazio, a interface deve orientar o usuário a adicionar o primeiro jogo. Jogos populares podem ser exibidos como atalhos, desde que venham do catálogo integrado e não sejam exemplos fictícios.

### RF-02 — Busca incremental de jogos

A busca deve:

- iniciar enquanto o usuário digita;
- usar debounce de aproximadamente 250 ms;
- aceitar nome completo, nome parcial, franquia e títulos alternativos;
- tolerar erros simples de digitação;
- ordenar inicialmente por relevância e depois por popularidade;
- mostrar resultados progressivamente;
- ser paginada, sem carregar todo o catálogo no navegador;
- consultar um índice local rápido, sem acessar o provedor externo a cada tecla.

Cada resultado deve apresentar, quando disponível:

- capa oficial ou autorizada;
- título oficial;
- edição;
- plataformas compatíveis;
- preço no mercado ativo;
- estado da promoção;
- disponibilidade no Game Pass;
- estado de lançamento.

A busca deve evitar que DLCs, moedas virtuais, consumíveis e complementos apareçam como jogos principais. Esses produtos podem ser exibidos apenas em contexto apropriado e claramente identificados.

Filtros previstos:

- disponível no Game Pass;
- Xbox Series X|S;
- Xbox One;
- PC;
- lançamento futuro;
- promoção.

### RF-03 — Capas e artes

As capas devem vir do catálogo integrado ou de outra fonte cujo uso tenha sido validado. A aplicação deve:

- usar a arte correspondente ao produto ou edição;
- fornecer texto alternativo acessível;
- ter estado de carregamento e fallback neutro quando a arte não estiver disponível;
- não apresentar imagens ilustrativas como se fossem capas oficiais;
- respeitar os direitos e termos aplicáveis à exibição das imagens.

### RF-04 — Adição ao carrinho

Ao adicionar um produto:

- o item deve entrar no carrinho sem recarregar a página;
- o cálculo deve ser atualizado automaticamente;
- o controle “Adicionar” deve refletir o estado “Adicionado”;
- a mesma edição não deve ser duplicada;
- o usuário deve permanecer no contexto de busca;
- não deve haver modal obrigatório nem navegação para outra página.

### RF-05 — Edições e produtos

A unidade de comparação é uma edição comercializável específica, como Standard, Deluxe, Premium ou Bundle.

Regras:

- selecionar a edição Standard por padrão quando ela estiver disponível;
- distinguir o jogo conceitual do produto vendido;
- distinguir jogo base, edição, bundle, DLC e complemento;
- mostrar claramente quando a assinatura inclui apenas o jogo base;
- impedir dupla contagem quando uma edição ou bundle já incluir outro produto selecionado;
- preservar o identificador da edição no carrinho e nos links compartilhados.

### RF-06 — Carrinho inteligente

O carrinho é uma lista de intenção, não um checkout.

Cada item deve conter:

- capa em miniatura;
- nome do jogo;
- edição;
- plataformas;
- preço local vigente;
- disponibilidade por plano;
- indicação de dado desatualizado ou indisponível;
- controle para marcar o jogo como já possuído;
- ação de remoção;
- link para a página oficial da edição na Xbox Store.

O carrinho deve permitir:

- remover itens individualmente;
- limpar toda a seleção;
- trocar edição;
- marcar e desmarcar um item como já possuído;
- compartilhar a comparação;
- trocar o mercado;
- restaurar a seleção após fechar e reabrir o navegador.

No desktop, o resumo financeiro pode permanecer visível na lateral. Em telas pequenas, o total deve continuar acessível e o carrinho pode abrir em um painel expansível. Essa orientação descreve comportamento e prioridade de informação, não um layout visual obrigatório.

### RF-07 — Cálculo automático

O cálculo deve ocorrer sem botão obrigatório de confirmação sempre que houver mudança em:

- itens do carrinho;
- edição;
- mercado;
- plano;
- plataforma ou dispositivo;
- número de meses;
- estado “já possuído”;
- preferência de revisitar um jogo;
- dados de catálogo ou preço relevantes.

O cálculo básico deve ser executado no navegador para resposta imediata. O backend deve conseguir recalcular e validar simulações compartilhadas.

### RF-08 — Plano, período e hábitos

O usuário deve poder informar:

- plano Game Pass a comparar;
- plataforma ou dispositivo utilizado;
- período de assinatura entre 1 e 36 meses;
- horas disponíveis por semana, opcionalmente;
- intenção de terminar campanhas, revisitar jogos ou jogar ocasionalmente;
- se deseja considerar apenas os meses em que efetivamente jogará;
- horas pretendidas para jogos sem campanha definida.

Estimativas de duração devem ser identificadas como estimativas e acompanhadas da fonte. Se uma fonte licenciada ou confiável não estiver disponível, o campo deve permanecer manual ou ser adiado.

### RF-09 — Resultado e recomendação

O sistema deve calcular e comparar:

| Cenário | Definição |
|---|---|
| Comprar tudo | Soma dos preços das edições selecionadas, excluindo itens já possuídos e duplicações |
| Assinar | Custo do plano durante o período escolhido, acrescido dos jogos não incluídos no plano |
| Híbrido | Assinatura por um período e compra dos jogos fora do catálogo ou que o usuário deseja manter/revisitar |

O resultado deve mostrar:

- custo de cada cenário;
- opção de menor custo;
- diferença monetária entre as opções;
- ponto de equilíbrio em meses;
- jogos que exigem compra adicional;
- jogos incompatíveis com o plano ou dispositivo;
- premissas usadas no cálculo;
- data e horário da atualização dos preços;
- alertas sobre dados ausentes, promoções e disponibilidade no catálogo;
- diferença entre licença de compra e acesso por assinatura.

A recomendação deve ser determinística, explicável e auditável. Quando faltarem dados que impeçam uma conclusão confiável, o sistema deve mostrar “Comparação parcial” e não apresentar economia definitiva.

### RF-10 — Compartilhamento

O usuário deve poder gerar um link para a simulação.

O link deve preservar:

- mercado;
- idioma, quando necessário;
- IDs dos produtos e edições;
- plano selecionado;
- período;
- plataforma;
- itens marcados como já possuídos;
- preferências relevantes ao cálculo.

Ao abrir o link, o sistema deve atualizar preços e disponibilidade conforme o mercado salvo ou selecionado e informar quando os valores diferirem dos registrados na criação da simulação.

---

## 7. Localização: Brasil e Estados Unidos

### RF-11 — Resolução de mercado

Na primeira visita, o sistema deve tentar identificar o mercado provável por geolocalização aproximada de IP oferecida pela infraestrutura de hospedagem. Não deve solicitar acesso ao GPS.

Prioridade para definição do mercado:

1. escolha manual salva pelo usuário;
2. mercado detectado pela infraestrutura;
3. padrão configurado pela aplicação.

Se o mercado não puder ser identificado com confiança, a aplicação deve apresentar o seletor Brasil/Estados Unidos sem afirmar que houve detecção automática.

### RF-12 — Dados regionais

| Característica | Brasil | Estados Unidos |
|---|---|---|
| Código de mercado | BR | US |
| Idioma inicial | pt-BR | en-US |
| Moeda | BRL | USD |
| Fonte de preço | Xbox Store Brasil | Xbox Store Estados Unidos |
| Formatação | R$ 299,00 | $59.99 |
| Planos | Preços brasileiros | Preços americanos |

Regras obrigatórias:

- país e idioma devem poder ser alterados independentemente;
- uma pessoa no Brasil pode simular o mercado dos Estados Unidos e vice-versa;
- preços de um mercado não podem ser usados em outro;
- preços americanos não podem ser derivados pela conversão de valores brasileiros;
- planos, catálogo, promoções e disponibilidade devem corresponder ao mercado ativo;
- deve ser exibida a data e a hora da última atualização;
- nos Estados Unidos, deve-se informar que sales tax pode ser acrescentado no checkout conforme a localidade;
- a aplicação não deve inventar ou aplicar uma taxa americana uniforme;
- URLs devem refletir o mercado, por exemplo `/br` e `/us`;
- URLs localizadas devem ser compartilháveis e indexáveis quando aplicável.

### RF-13 — Troca de mercado

Ao mudar de país:

- preservar a seleção por identificadores de produto;
- recarregar preços, planos, promoções e disponibilidade;
- informar produtos indisponíveis no novo mercado;
- nunca substituir um produto indisponível por outro sem confirmação;
- recalcular todos os cenários.

---

## 8. Motor de comparação e regras de cálculo

### 8.1 Entradas mínimas

- mercado;
- lista de produtos e edições;
- preço vigente de cada edição;
- plano selecionado;
- preço do plano no mercado;
- número de meses;
- plataforma ou dispositivo;
- disponibilidade dos produtos no plano;
- jogos já possuídos.

### 8.2 Custo de compra

Para os produtos elegíveis e ainda não possuídos:

```text
C_compra = soma(preço vigente de cada edição selecionada)
```

O preço vigente é o preço promocional válido quando houver; caso contrário, é o preço regular.

### 8.3 Custo de assinatura

```text
C_assinatura_base = meses × preço mensal do plano
```

Se o modelo de cobrança do plano não for mensal ou houver preço válido para outro ciclo, o cálculo deve usar o ciclo real e explicar a premissa.

### 8.4 Cenário com jogos fora do plano

Antes da recomendação, a aplicação deve verificar se cada produto está disponível no plano, mercado e dispositivo selecionados.

```text
C_assinatura = C_assinatura_base
             + soma(preço dos jogos necessários que estão fora do plano)
```

A aplicação não pode recomendar uma assinatura como opção completa se ela não oferecer acesso aos jogos desejados sem incluir o custo das compras adicionais.

### 8.5 Cenário híbrido

```text
C_hibrido = custo da assinatura no período escolhido
          + soma(jogos fora do catálogo)
          + soma(jogos que o usuário decidiu manter ou revisitar)
```

Ao evitar dupla contagem, jogos já possuídos e produtos incluídos em bundles selecionados devem ser excluídos do custo incremental correspondente.

### 8.6 Economia

Para comparar compra e assinatura completa:

```text
Economia_da_assinatura = C_compra - C_assinatura
```

- resultado positivo: assinatura custa menos;
- resultado negativo: compra custa menos;
- resultado zero: empate financeiro para as premissas atuais.

A comparação entre os três cenários deve usar o menor custo válido, sem esconder as diferenças de propriedade e acesso.

### 8.7 Ponto de equilíbrio

Para preço mensal constante e dados completos:

```text
Ponto_de_equilibrio_em_meses = C_compra / preço_mensal_do_plano
```

Quando existirem compras adicionais obrigatórias, ciclos de cobrança diferentes ou mudanças de preço conhecidas, o ponto de equilíbrio deve ser calculado sobre a série real de custos, não apenas pela fórmula simplificada.

### 8.8 Precisão monetária

- Armazenar valores monetários como inteiros em unidades mínimas, por exemplo centavos.
- Não usar ponto flutuante para operações financeiras.
- Arredondar apenas conforme as regras de exibição e cobrança do mercado.
- Não somar moedas diferentes.

### 8.9 Comparação parcial

Um item com preço desconhecido não deve receber preço zero. Quando faltar um dado essencial:

- excluir o valor desconhecido do total definitivo;
- identificar os itens afetados;
- mostrar subtotal conhecido quando útil;
- rotular o resultado como “Comparação parcial”;
- não declarar economia definitiva nem vencedor absoluto.

---

## 9. Catálogo, preços, capas e disponibilidade

### 9.1 Princípio de integração

O componente mais crítico é a obtenção confiável de catálogo, preços, artes e disponibilidade do Game Pass por mercado e edição.

Antes do lançamento, a equipe deve validar uma fonte de dados utilizável e autorizada, incluindo:

- termos de uso;
- direito de exibição das artes;
- cobertura de Brasil e Estados Unidos;
- limites de acesso;
- estabilidade;
- identificação de produtos e edições;
- frequência permitida de atualização;
- disponibilidade por plano e plataforma.

A existência de dados ou imagens visíveis em páginas públicas não deve ser tratada automaticamente como autorização para uso por uma aplicação comercial. APIs de parceiros, propriedade ou licenças também não devem ser presumidas como APIs públicas de catálogo e preços.

Se a fonte aprovada não oferecer cobertura suficiente, deve-se usar outro provedor autorizado ou reduzir explicitamente a cobertura. O produto não deve prometer preços ao vivo que não consegue fornecer.

### RF-14 — Registro de catálogo

Cada jogo e edição deve oferecer, conforme disponibilidade:

| Campo | Descrição |
|---|---|
| `game_id` | Identificador interno estável do jogo conceitual |
| `store_product_id` | Identificador do produto na Microsoft Store |
| `title` | Título oficial localizado |
| `alternate_titles` | Títulos alternativos pesquisáveis |
| `cover_url` | URL da arte autorizada |
| `edition_id` | Identificador interno da edição |
| `edition_name` | Nome da edição |
| `product_type` | Jogo base, edição, bundle, DLC ou complemento |
| `platforms` | Plataformas suportadas |
| `release_date` | Data de lançamento |
| `release_status` | Lançado, pré-venda ou anunciado |
| `store_url` | Página oficial da edição |
| `market` | BR ou US |
| `currency` | BRL ou USD |
| `list_price_minor` | Preço regular em unidade mínima |
| `sale_price_minor` | Preço promocional em unidade mínima |
| `sale_end_at` | Fim da promoção, se disponível |
| `member_price_minor` | Preço para assinantes, se aplicável |
| `game_pass_plans` | Planos nos quais está incluído |
| `source` | Origem do dado |
| `last_verified_at` | Última verificação bem-sucedida |

### RF-15 — Atualização e cache

- Buscar no índice local durante a experiência interativa.
- Atualizar dados no servidor em processos periódicos.
- Não consultar a fonte externa a cada tecla digitada.
- Priorizar jogos populares, recentemente selecionados e em promoção.
- Invalidar o cache quando mercado ou edição mudar.
- Manter o último valor conhecido em caso de falha, claramente marcado como desatualizado.
- Nunca substituir preço desconhecido por zero.
- Registrar histórico de preços por mercado e edição.
- Registrar a origem e o horário de verificação de cada preço.
- Diferenciar preço público, preço promocional e preço exclusivo para assinantes.
- Não inferir inclusão no Game Pass apenas pela presença de um selo gráfico.
- Monitorar falhas, mudanças de catálogo e inconsistências entre mercados.

### RF-16 — Atualização de disponibilidade

Quando um jogo entrar ou sair de um plano:

- atualizar a relação de disponibilidade com período de validade quando conhecido;
- invalidar resultados afetados;
- recalcular comparações abertas ou compartilhadas quando forem acessadas;
- informar ao usuário a mudança quando ela afetar o resultado.

---

## 10. Arquitetura técnica

### 10.1 Visão de componentes

| Componente | Responsabilidade |
|---|---|
| Aplicação web | Busca, catálogo visual, carrinho, preferências, simulador e localização |
| Backend for Frontend/API | Resolução de mercado, pesquisa, catálogo, preços, planos, compartilhamento e validação da comparação |
| PostgreSQL/Supabase | Jogos, edições, produtos, preços, planos, disponibilidade e histórico |
| Provedor de catálogo Xbox | Dados autorizados de catálogo, imagens, preços e disponibilidade por mercado |
| Jobs/Workers | Sincronização, atualização, validação, retentativas e alertas de falha |

### 10.2 Stack proposta

| Camada | Tecnologia |
|---|---|
| Aplicação | Next.js App Router + TypeScript |
| Interface | Tailwind CSS + shadcn/ui |
| Estado do carrinho | Zustand |
| Persistência local | `localStorage` |
| Banco de dados | Supabase PostgreSQL |
| Busca | PostgreSQL Full Text Search + trigram |
| Hospedagem | Vercel |
| Processos agendados | Vercel Cron, com fila se necessário |
| Internacionalização | `next-intl` |
| Monitoramento | Sentry |
| Testes | Vitest + Playwright |

As tecnologias são uma proposta coerente para o MVP e podem ser substituídas desde que os contratos funcionais e não funcionais deste documento sejam preservados.

### 10.3 Responsabilidades entre cliente e servidor

**Cliente:**

- estado imediato da busca e do carrinho;
- persistência local;
- cálculo instantâneo com os dados recebidos;
- formatação localizada;
- atualização reativa da comparação.

**Servidor:**

- acesso a fontes externas;
- normalização de catálogo;
- resolução de mercado;
- busca indexada;
- preços e planos vigentes;
- validação de compatibilidade;
- histórico e auditoria;
- criação e leitura de links compartilháveis;
- recálculo confiável de simulações compartilhadas.

---

## 11. Modelo de dados

O modelo deve separar o jogo conceitual dos produtos comercializáveis e dos dados regionais.

### 11.1 Entidades principais

#### `games`

Representa a obra ou jogo conceitual.

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | UUID | Chave interna estável |
| `canonical_title` | text | Título canônico |
| `slug` | text | Identificador legível |
| `release_date` | date, nullable | Data conhecida |
| `release_status` | enum | `released`, `preorder`, `announced` |
| `created_at` | timestamptz | Auditoria |
| `updated_at` | timestamptz | Auditoria |

#### `game_localizations`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `game_id` | UUID | Referência a `games` |
| `locale` | text | `pt-BR` ou `en-US` |
| `title` | text | Título localizado |
| `alternate_titles` | text[] | Busca por variações |
| `description` | text, nullable | Descrição autorizada |

#### `editions`

Representa uma edição comercializável ou agrupamento.

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | UUID | Chave interna |
| `game_id` | UUID | Jogo conceitual |
| `name` | text | Standard, Deluxe, Premium etc. |
| `product_type` | enum | `base_game`, `edition`, `bundle`, `dlc`, `addon` |
| `is_default` | boolean | Preferência da edição Standard |
| `includes_base_game` | boolean | Evita comparação incorreta |

#### `edition_components`

Representa produtos incluídos em uma edição ou bundle e permite evitar dupla contagem.

| Campo | Tipo sugerido |
|---|---|
| `parent_edition_id` | UUID |
| `included_edition_id` | UUID |

#### `store_products`

Representa a publicação de uma edição na loja.

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | UUID | Chave interna |
| `edition_id` | UUID | Edição correspondente |
| `provider` | text | Provedor de origem |
| `store_product_id` | text | ID externo |
| `store_url` | text | URL oficial |
| `cover_url` | text, nullable | Arte autorizada |
| `platforms` | text[] | Plataformas compatíveis |

#### `market_offers`

Representa preço e disponibilidade de um produto em um mercado.

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | UUID | Chave interna |
| `store_product_id` | UUID | Produto interno |
| `market` | char(2) | BR ou US |
| `currency` | char(3) | BRL ou USD |
| `availability` | enum | Disponível, indisponível, pré-venda |
| `list_price_minor` | bigint, nullable | Unidade mínima |
| `sale_price_minor` | bigint, nullable | Unidade mínima |
| `member_price_minor` | bigint, nullable | Preço para assinante |
| `sale_end_at` | timestamptz, nullable | Fim conhecido |
| `source` | text | Origem auditável |
| `last_verified_at` | timestamptz | Último sucesso |
| `stale_at` | timestamptz, nullable | Limite de atualidade |

#### `price_history`

| Campo | Tipo sugerido |
|---|---|
| `id` | UUID |
| `market_offer_id` | UUID |
| `price_type` | enum |
| `amount_minor` | bigint |
| `valid_from` | timestamptz |
| `valid_until` | timestamptz, nullable |
| `observed_at` | timestamptz |

#### `game_pass_plans`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | UUID | Chave interna |
| `code` | text | Código estável do plano |
| `market` | char(2) | Mercado |
| `localized_name` | text | Nome exibido |
| `currency` | char(3) | Moeda |
| `billing_period` | enum | Ciclo real |
| `price_minor` | bigint | Preço vigente |
| `platforms` | text[] | Plataformas cobertas |
| `last_verified_at` | timestamptz | Auditoria |

#### `plan_catalog_entries`

Relaciona produto, plano, mercado, plataforma e validade.

| Campo | Tipo sugerido |
|---|---|
| `plan_id` | UUID |
| `store_product_id` | UUID |
| `market` | char(2) |
| `platforms` | text[] |
| `available_from` | timestamptz, nullable |
| `available_until` | timestamptz, nullable |
| `last_verified_at` | timestamptz |
| `source` | text |

#### `shared_comparisons`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | text | Identificador não sequencial |
| `market` | char(2) | Mercado salvo |
| `locale` | text | Idioma |
| `plan_id` | UUID, nullable | Plano escolhido |
| `months` | smallint | 1 a 36 |
| `platform` | text | Dispositivo/plataforma |
| `preferences` | jsonb | Hábitos relevantes |
| `created_at` | timestamptz | Auditoria |
| `expires_at` | timestamptz, nullable | Conforme política definida |

#### `shared_comparison_items`

| Campo | Tipo sugerido |
|---|---|
| `comparison_id` | text |
| `store_product_id` | UUID |
| `already_owned` | boolean |
| `keep_or_revisit` | boolean |
| `planned_hours` | integer, nullable |

### 11.2 Restrições importantes

- Unicidade de `store_product_id` por provedor.
- Unicidade de oferta por produto e mercado no mesmo período de validade.
- Moeda da oferta compatível com o mercado.
- Valores monetários inteiros e não negativos.
- Período de comparação entre 1 e 36 meses.
- Relações de inclusão sem ciclos.
- Registro de fonte e data de verificação para preços e disponibilidade.

---

## 12. Contratos de API

Os formatos abaixo são contratos funcionais sugeridos; podem evoluir durante o detalhamento técnico.

### `GET /api/markets`

Retorna mercados suportados, idiomas, moedas e estado de disponibilidade.

### `GET /api/games?q={query}&market={BR|US}`

Busca jogos e edições no índice local, com paginação, filtros, capas, preços regionais e resumo de disponibilidade por plano.

Parâmetros opcionais:

- `locale`;
- `platform`;
- `gamePassOnly`;
- `onSale`;
- `releaseStatus`;
- `cursor` ou `page`.

### `GET /api/games/:id?market={BR|US}`

Retorna detalhes do jogo, edições, componentes, plataformas, ofertas regionais, links oficiais e disponibilidade por plano.

### `GET /api/plans?market={BR|US}`

Retorna planos disponíveis, preços, ciclos de cobrança, plataformas e última verificação.

### `POST /api/compare`

Recebe uma simulação e devolve o cálculo validado pelo servidor.

Entrada mínima:

```json
{
  "market": "BR",
  "planId": "uuid",
  "months": 3,
  "platform": "xbox-series",
  "items": [
    {
      "storeProductId": "uuid",
      "alreadyOwned": false,
      "keepOrRevisit": false
    }
  ]
}
```

Saída esperada:

- custos de compra, assinatura e híbrido;
- moeda;
- recomendação;
- diferença entre cenários;
- ponto de equilíbrio, quando calculável;
- itens fora do plano;
- itens incompatíveis;
- dados ausentes;
- estado completo ou parcial;
- premissas;
- carimbos de atualização.

### `POST /api/share`

Valida a simulação, persiste apenas os dados necessários e cria um identificador compartilhável.

### `GET /api/share/:id`

Recupera a configuração da comparação. Os preços e a disponibilidade devem ser revalidados antes da apresentação.

### Regras gerais da API

- Validar mercado, moeda, plano, período e IDs de produtos.
- Não confiar em preços enviados pelo cliente.
- Aplicar limites de requisição apropriados.
- Não expor credenciais de provedores.
- Retornar estados explícitos para dado ausente, indisponível ou desatualizado.
- Manter respostas localizáveis sem acoplar texto de apresentação à lógica financeira.

---

## 13. Regras de negócio e casos especiais

| Situação | Comportamento esperado |
|---|---|
| Jogo ainda não lançado | Mostrar “pré-venda” ou “preço indisponível”; não assumir acesso imediato |
| Jogo apenas anunciado | Não atribuir preço ou disponibilidade não confirmados |
| Jogo sai do Game Pass | Recalcular os cenários afetados |
| Jogo entra no Game Pass | Atualizar a elegibilidade e recalcular |
| Jogo indisponível no Brasil | Informar indisponibilidade; não usar o preço dos EUA |
| Jogo indisponível nos EUA | Informar indisponibilidade; não usar o preço do Brasil |
| Edição superior inclui o jogo base | Evitar duplicação |
| Bundle contém produto selecionado | Evitar dupla contagem e explicar a inclusão |
| DLC ou complemento | Não tratar como jogo principal; informar dependência do jogo base |
| Jogo gratuito | Identificar como free-to-play; não atribuir economia artificial |
| Promoção termina | Usar o novo preço verificado e atualizar o cálculo |
| Preço promocional sem data final | Mostrar a promoção, indicar validade não informada e manter verificação frequente |
| Preço não encontrado | Excluir do total definitivo e sinalizar comparação parcial |
| Dado antigo | Mostrar último valor conhecido como desatualizado, nunca como preço atual confirmado |
| Plano não inclui o jogo | Acrescentar compra necessária ou indicar plano elegível |
| Plano inclui apenas o jogo base | Não considerar conteúdos da edição superior como incluídos |
| Plataforma incompatível | Não contar o acesso como válido para o dispositivo selecionado |
| Troca de país | Preservar IDs, buscar preços e planos do novo mercado e recalcular |
| Carrinho compartilhado | Preservar configuração, revalidar valores e informar mudanças |
| Usuário fecha o navegador | Restaurar a comparação local |
| Jogo já comprado | Excluir do custo incremental de compra |
| Mesmo item adicionado duas vezes | Manter uma única ocorrência |
| Sales tax nos EUA | Informar possível acréscimo no checkout; não calcular taxa uniforme |
| Falha do provedor | Usar último dado conhecido marcado como desatualizado ou declarar indisponibilidade |

### 13.1 Compra versus assinatura

A explicação do resultado deve deixar claro:

- a compra concede uma licença digital sujeita aos termos da loja;
- a assinatura concede acesso condicionado à continuidade do plano;
- jogos podem sair do catálogo;
- o acesso pode variar por mercado, plano e plataforma;
- comprar pode ser preferível para jogos que o usuário deseja manter ou revisitar, mesmo quando não for o menor custo imediato.

---

## 14. Requisitos não funcionais

### 14.1 Performance

- Meta de LCP inferior a 2,5 segundos em conexão móvel adequada.
- Resposta percebida da busca inferior a 500 ms quando os dados estiverem em cache.
- Cálculo local praticamente imediato.
- Imagens otimizadas, responsivas e carregadas sem bloquear a interação principal.
- Resultados paginados e payloads limitados.

### 14.2 Acessibilidade

- Conformidade com WCAG 2.2 nível AA.
- Navegação completa por teclado.
- Foco visível e ordem lógica.
- Rótulos adequados para tecnologias assistivas.
- Contraste suficiente.
- Texto alternativo para capas.
- Alterações de total e resultado anunciadas sem interromper o usuário.
- Cores não devem ser o único meio de comunicar recomendação ou erro.

### 14.3 SEO

- Páginas localizadas por mercado.
- Metadados específicos para Brasil e Estados Unidos.
- URLs canônicas.
- `hreflang` apropriado.
- Páginas de jogos indexáveis quando houver dados suficientes e autorizados.
- Combinações arbitrárias de carrinho não devem gerar indexação ilimitada.
- Links compartilháveis devem adotar política explícita de indexação, preferencialmente sem indexação por padrão.

### 14.4 Privacidade

- Sem login obrigatório.
- Sem solicitação de localização precisa.
- Uso apenas de geolocalização aproximada de infraestrutura.
- Persistência mínima necessária.
- Política de privacidade compatível com LGPD e requisitos aplicáveis dos Estados Unidos.
- Não armazenar histórico pessoal de navegação ou comparação sem necessidade declarada.

### 14.5 Segurança

- Validar todas as entradas da API.
- Proteger endpoints de sincronização e administração.
- Manter segredos apenas no servidor.
- Aplicar limitação de requisições.
- Sanitizar termos de busca e conteúdo persistido.
- Usar identificadores não sequenciais para links compartilháveis.
- Definir retenção e expiração dos compartilhamentos.

### 14.6 Confiabilidade e observabilidade

- Monitorar falhas de integração.
- Alertar para preços desatualizados.
- Detectar mudanças incomuns de catálogo ou preço.
- Registrar origem e data de verificação.
- Medir taxa de sucesso da sincronização por mercado.
- Permitir auditoria de como cada resultado foi calculado.

### 14.7 Internacionalização

- Separar textos, formatos e regras de mercado.
- Usar formatação nativa para moeda, data e hora.
- Não acoplar idioma ao país.
- Preparar a arquitetura para novos mercados sem incluí-los no MVP.

---

## 15. Critérios de aceite do MVP

### 15.1 Mercado e localização

- [ ] Na primeira visita, o sistema resolve BR ou US sem solicitar GPS.
- [ ] Se a detecção falhar, o usuário pode escolher BR ou US sem mensagem falsa de detecção.
- [ ] A escolha manual é preservada e tem prioridade em visitas futuras.
- [ ] País e idioma podem ser alterados independentemente.
- [ ] URLs refletem o mercado.
- [ ] Trocar de mercado mantém os itens selecionados e recarrega seus dados regionais.
- [ ] Nenhum preço de BR é convertido para simular US, ou vice-versa.
- [ ] Valores são formatados corretamente em BRL e USD.
- [ ] A experiência dos EUA informa que sales tax pode variar no checkout.

### 15.2 Busca e catálogo visual

- [ ] O usuário consegue iniciar uma busca a partir da página inicial sem cadastro.
- [ ] A busca aceita título completo, parcial e franquia.
- [ ] Resultados começam a aparecer enquanto o usuário digita.
- [ ] A consulta usa debounce e índice local.
- [ ] Os resultados são paginados.
- [ ] Cada resultado válido mostra capa, título, edição, plataforma, preço e situação no Game Pass quando os dados existirem.
- [ ] DLCs, moedas e complementos não são exibidos como jogos principais.
- [ ] A capa possui texto alternativo e fallback quando indisponível.
- [ ] A interface não apresenta capas fictícias como oficiais.

### 15.3 Carrinho

- [ ] Adicionar um jogo não recarrega a página nem exige modal.
- [ ] O controle muda para indicar que o item foi adicionado.
- [ ] Adicionar novamente a mesma edição não duplica o custo.
- [ ] O usuário consegue remover um item e limpar o carrinho.
- [ ] Cada item mostra sua edição e link oficial.
- [ ] O usuário consegue marcar um item como já possuído.
- [ ] Itens já possuídos são excluídos do custo incremental.
- [ ] O carrinho é restaurado após fechar e reabrir o navegador.
- [ ] A comparação permanece acessível e utilizável em desktop e celular.

### 15.4 Comparação

- [ ] O usuário consegue escolher plano, plataforma e período de 1 a 36 meses.
- [ ] Toda mudança relevante recalcula os resultados automaticamente.
- [ ] O cenário “Comprar tudo” soma as edições corretas sem duplicação.
- [ ] O cenário “Assinar” inclui compras adicionais necessárias.
- [ ] O cenário híbrido considera itens fora do catálogo e itens que o usuário deseja manter.
- [ ] O sistema valida disponibilidade no plano, mercado e dispositivo.
- [ ] O resultado mostra os três custos na moeda correta.
- [ ] O resultado identifica a opção de menor custo e a diferença monetária.
- [ ] O ponto de equilíbrio é mostrado quando puder ser calculado com segurança.
- [ ] A recomendação explica suas premissas.
- [ ] O resultado diferencia propriedade/licença de acesso por assinatura.
- [ ] Preços desconhecidos nunca são tratados como zero.
- [ ] Dados essenciais ausentes geram “Comparação parcial”, sem economia definitiva.

### 15.5 Preços e disponibilidade

- [ ] Cada preço exibe sua última atualização.
- [ ] Preço promocional só é usado quando estiver vigente.
- [ ] Preço para assinante é distinguido do preço público.
- [ ] Dado antigo é exibido como desatualizado.
- [ ] Falha de atualização não apaga o último preço válido nem o transforma em zero.
- [ ] Inclusão no Game Pass é baseada em dado estruturado, não apenas em selo visual.
- [ ] A saída de um jogo do catálogo afeta a comparação.
- [ ] A fonte de catálogo, preços, artes e disponibilidade foi validada quanto a uso e cobertura antes do lançamento.

### 15.6 Compartilhamento

- [ ] O usuário consegue gerar um link da comparação.
- [ ] O link recupera jogos, edições, mercado, plano, período e preferências relevantes.
- [ ] Ao abrir o link, o sistema revalida preços e disponibilidade.
- [ ] Mudanças desde a criação são informadas.
- [ ] O servidor não confia em valores monetários enviados pelo cliente.

### 15.7 Qualidade

- [ ] Fluxos principais atendem WCAG 2.2 AA.
- [ ] Os objetivos de performance são medidos em ambiente representativo.
- [ ] Há testes unitários do motor de cálculo.
- [ ] Há testes de integração para preços, planos e mercados.
- [ ] Há testes ponta a ponta da jornada principal em BR e US.
- [ ] Falhas de sincronização são monitoradas.
- [ ] A origem e a data de cada preço podem ser auditadas.

---

## 16. Estratégia de testes

### 16.1 Testes unitários

- Soma de compra com uma e várias edições.
- Uso de preço promocional vigente.
- Expiração de promoção.
- Exclusão de item já possuído.
- Evitar duplicação de edição e bundle.
- Assinatura com todos os jogos incluídos.
- Assinatura com um ou mais jogos fora do plano.
- Incompatibilidade de plataforma.
- Cálculo híbrido.
- Ponto de equilíbrio.
- Valores ausentes e comparação parcial.
- Precisão com unidades monetárias inteiras.

### 16.2 Testes de integração

- Sincronização de catálogo por mercado.
- Normalização de edições e produtos.
- Atualização de ofertas e histórico.
- Entrada e saída de jogos de planos.
- Falha e retentativa do provedor.
- Resolução de mercado.
- Criação e recuperação de compartilhamento.

### 16.3 Testes ponta a ponta

- Usuário do Brasil pesquisa, adiciona, escolhe plano e compartilha.
- Usuário dos Estados Unidos executa o mesmo fluxo em USD.
- Usuário troca BR por US com o carrinho preenchido.
- Usuário retorna ao site e recupera o carrinho local.
- Usuário adiciona um jogo fora do plano e recebe cenário corrigido.
- Usuário encontra dado ausente e vê comparação parcial.
- Jornada completa por teclado e com tecnologia assistiva.

### 16.4 Conjunto de validação de dados

Antes do lançamento, testar aproximadamente 30 jogos que cubram:

- jogos populares e menos populares;
- jogos base e múltiplas edições;
- bundles;
- DLCs e complementos;
- free-to-play;
- lançados, pré-venda e anunciados;
- disponíveis e ausentes no Game Pass;
- diferentes planos e plataformas;
- promoções;
- produtos disponíveis em apenas um mercado;
- preços para assinantes e não assinantes.

---

## 17. Fases de implementação

### Fase 0 — Validação de dados

Objetivo: eliminar o principal risco técnico antes de construir a experiência completa.

Entregas:

- confirmar fonte autorizada de catálogo, preços, imagens e disponibilidade;
- confirmar cobertura real de BR e US;
- documentar termos, limites e frequência de atualização;
- prototipar normalização de jogos, edições e produtos;
- testar aproximadamente 30 jogos representativos;
- validar correspondência entre preço, edição, plano, plataforma e mercado;
- definir política para dados ausentes e desatualizados.

**Esta fase é bloqueadora do lançamento.**

### Fase 1 — Busca visual e carrinho

Entregas:

- página inicial;
- localização BR/US;
- idioma e moeda localizados;
- catálogo com capas;
- busca incremental e filtros essenciais;
- seleção de edição;
- adicionar, remover e limpar;
- marcação de jogos já possuídos;
- persistência local;
- experiência responsiva e acessível.

### Fase 2 — Comparador financeiro

Entregas:

- preços por mercado;
- planos e preços locais;
- seleção de plataforma e meses;
- cálculo de compra, assinatura e híbrido;
- ponto de equilíbrio;
- validação de disponibilidade;
- tratamento de bundles, jogos fora do plano e dados ausentes;
- explicação da recomendação;
- testes unitários abrangentes.

### Fase 3 — Lançamento público

Entregas:

- links compartilháveis;
- revalidação das simulações;
- SEO localizado;
- monitoramento e alertas;
- testes ponta a ponta;
- revisão WCAG 2.2 AA;
- política de privacidade;
- auditoria de fontes, preços e permissões de imagem;
- validação das metas de performance.

### Fase 4 — Inteligência adicional

Entregas possíveis após validação do MVP:

- estimativas de duração com fonte explícita;
- planejamento de jogos por mês;
- cálculo baseado em horas semanais;
- histórico de preços para o usuário;
- alertas de promoção;
- sugestões automáticas de períodos de assinatura e compra;
- expansão futura para outras plataformas, sem comprometer o núcleo Xbox.

---

## 18. Riscos e decisões em aberto

### 18.1 Fonte de dados

Maior risco do produto. É necessário comprovar acesso permitido, cobertura, estabilidade e direito de exibição antes do lançamento.

### 18.2 Nomes e composição dos planos

Planos, preços e benefícios podem mudar. O produto deve modelá-los como dados regionais versionáveis, não como constantes fixas no código.

### 18.3 Duração dos jogos

Estimativas dependem de fonte permitida e metodologia clara. Na ausência disso, deve-se usar entrada manual ou adiar a automação.

### 18.4 Disponibilidade futura

A permanência de um jogo no catálogo não é garantida. O MVP deve comparar o estado conhecido e explicar essa limitação, sem prever permanência como certeza.

### 18.5 Links compartilháveis

Deve-se definir retenção, expiração, privacidade e política de indexação sem introduzir contas de usuário.

---

## 19. Métricas iniciais de produto

As métricas servem para avaliar utilidade, não monetização.

- Percentual de visitantes que iniciam uma busca.
- Percentual que adiciona pelo menos um jogo.
- Número mediano de jogos por comparação.
- Percentual que ajusta plano ou período.
- Percentual que recebe uma comparação completa.
- Percentual de comparações parciais por motivo.
- Taxa de criação e abertura de links compartilhados.
- Tempo até o primeiro resultado útil.
- Latência percebida da busca.
- Taxa de falha e desatualização por mercado.
- Divergências encontradas entre produto, preço e edição.

As medições devem respeitar a política de privacidade e evitar coleta desnecessária.

---

## 20. Definição de pronto

O MVP estará pronto quando um visitante do Brasil ou dos Estados Unidos conseguir, sem cadastro:

1. abrir o site com mercado e moeda adequados;
2. pesquisar ao menos um jogo por nome;
3. visualizar a capa e a edição correta;
4. adicionar a edição ao carrinho de comparação;
5. consultar um preço regional atualizado e auditável;
6. selecionar um plano Game Pass compatível;
7. escolher plataforma e período de assinatura;
8. receber uma comparação confiável entre compra, assinatura e cenário híbrido;
9. entender itens fora do plano, premissas e limitações;
10. compartilhar a simulação por link;
11. retornar ao site e recuperar o carrinho local.

O núcleo a preservar em qualquer redução de escopo é:

> Catálogo visual + carrinho de intenção + comparação financeira instantânea.

