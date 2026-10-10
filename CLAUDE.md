# Game Pass ou Comprar? — como trabalhar neste projeto

Especificação original: `game-pass-ou-comprar-prd.md` (gerada no ChatGPT; **não é lei**). Revisão crítica e escopo aceito: `docs/prd-review.md` — quando divergirem, vale a revisão. Idioma do produto e das conversas: pt-BR.

Repositório git local (ainda sem remoto). Commit/push só quando o usuário pedir ou ao fechar uma etapa aceita; antes de mudanças arriscadas, um commit serve como versão recuperável.

## Forma de trabalho (toda tarefa)

Adaptado do harness "Karpathy autoresearch" (@beamnxw), o mesmo do projeto Archy. Vale para qualquer pedido; em tarefas triviais, aplique de forma proporcional (sem cerimônia).

### Antes de começar
- Defina por escrito: **tarefa**, **entregável + caminho**, **checks de aceitação**, **fontes**, **escopo permitido**, **limite** (tempo/tentativas/custo). Se faltar um detalhe que muda o resultado, faça **uma** pergunta focada; senão, decida e registre.
- Leia `CLAUDE.md`, `docs/prd-review.md` e `progress.md`. Inspecione os arquivos citados antes de confiar no status descrito.
- Estabeleça uma **baseline** antes de mudar o sistema (estado atual, testes passando, como medir).

### Execução (loop)
1. Inspecione o estado salvo e escolha **um passo limitado**.
2. Construa/revise o artefato dentro do escopo.
3. Rode os checks relevantes a essa mudança.
4. Mantenha o que melhorou; desfaça só as suas mudanças que falharam.
5. Registre resultado (inclusive tentativas que falharam) e o checkpoint.
6. Continue até concluir, travar num bloqueio ou atingir o limite.

Não enfraqueça checks de aceitação para obter "pass". Não repita uma abordagem que falhou sem um motivo novo. Com resultados equivalentes, prefira a solução mais simples.

### Ferramentas e permissões
- Confirme que a fonte é legível antes de rodadas longas. Registre falhas de acesso; só tente de novo depois de mudar algo relevante.
- Edite só dentro do escopo e preserve trabalho existente.
- **Pergunte antes** de publicar, deployar, enviar mensagens/e-mails ou gastar dinheiro. Antes de repetir uma escrita externa, verifique se a primeira tentativa já funcionou.
- Contas e chaves deste projeto ficam **separadas** das do Archy e do Onde Foi (projeto Supabase próprio, projeto Vercel próprio). A conta Vercel do usuário (`gustavobburin-9893`) já está logada no CLI (`npx vercel`).
- Endpoints da Microsoft (`displaycatalog.mp.microsoft.com`, `catalog.gamepass.com` e o estado `__PRELOADED_STATE__` das páginas `xbox.com/{locale}/search/results/games` e `/games/browse`, usado para busca e destaques) são **não documentados**: acesse com baixa frequência, só pelo job de sincronização ou cache do servidor, nunca a cada tecla nem direto do navegador.

### Revisão (com o Codex CLI como parceiro)
- O **Codex CLI** (`codex`, em `~/.local/bin/codex`) é parceiro de codificação e o **revisor separado** preferencial. Ex.:
  `codex exec -s read-only -C /Users/gustavoburin/Desktop/gamepass -o <scratchpad>/codex-review.md "<pedido com caminhos, checks e fontes>" </dev/null`
  (`</dev/null` evita que ele fique esperando stdin.) Diff pendente: `codex exec review --uncommitted </dev/null`.
- Passe ao revisor: caminho do entregável, checks de aceitação e onde estão as fontes. Diga qual método de revisão foi usado.
- Trate a saída do Codex como **evidência a verificar**, não como ordem. Pode delegar subtarefas de código bem delimitadas (`-s workspace-write`), revisando o diff depois.
- Para tarefas relevantes, salve `checks.md` com uma linha por requisito: `requisito | veredito (pass/fail/unresolved) | evidência | correção`. Evidência = caminho, link ou saída real de comando.

### Conclusão
Antes de dizer "pronto", cheque com evidência observável: o entregável existe e roda; os checks rodaram contra a versão salva; falhas foram corrigidas ou reportadas; `progress.md` bate com o workspace. Se um limite ou bloqueio impedir a conclusão, entregue status parcial com o trabalho restante exato.

### Handoff — `progress.md`
Depois de cada etapa significativa, atualize `progress.md`: **Tarefa**, **Saídas**, **Concluído**, **Decisões**, **Pendências**, **Próxima ação**. Ao retomar: leia a nota, inspecione os arquivos e continue da próxima ação.

### Procedimentos recorrentes
Depois da primeira execução aceita de um fluxo repetível (sync de catálogo, deploy), salve o procedimento aqui ou como skill, preservando as instruções existentes.
