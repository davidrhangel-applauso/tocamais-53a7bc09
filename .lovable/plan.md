
<contexto-e-diagnostico>
Você disse que:
- o PIX chega e o pedido chega,
- mas ao “Confirmar que recebi o PIX” o valor não entra no dashboard,
- e você confirmou agora que “a gorjeta não aparece no histórico”.

Pelo código atual, isso acontece quando os pedidos de PIX direto (principalmente no fluxo “2 etapas”) ficam com <code>valor = null</code> e/ou não conseguem ser atualizados para <code>aguardando_confirmacao_pix</code> com o valor. Sem <code>pedido.valor</code>, o Painel do artista não chama a criação de <code>gorjeta</code> (ele só marca como pendente), então nada entra no histórico e, por consequência, nada soma no dashboard.

A causa raiz mais provável é: o passo 2 do <code>TwoStepPixPaymentDialog</code> tenta fazer <code>update</code> em <code>pedidos</code> para setar <code>valor</code> e status, mas a política de acesso do backend não permite update de pedidos por cliente/sessão (só o artista pode atualizar). Resultado: o pedido fica sem valor, e quando o artista confirma, não vira gorjeta.
</contexto-e-diagnostico>

<objetivo>
1) Garantir que, no PIX direto (2 etapas), o cliente consiga registrar o valor no pedido (de forma segura) antes do artista confirmar.
2) Garantir que, ao confirmar no painel, a gorjeta seja criada e apareça no Histórico, somando no dashboard.
</objetivo>

<plano-de-implementacao>
<passo-1-validar-com-dados-do-backend>
Vou checar no backend (ambiente de teste/Preview) os pedidos recentes em status <code>aguardando_pix</code>/<code>aguardando_confirmacao_pix</code> e confirmar se eles estão ficando com <code>valor</code> nulo/zero quando deveriam ter valor.
Isso confirma o diagnóstico com dados reais.
</passo-1-validar-com-dados-do-backend>

<passo-2-corrigir-a-forma-de-gravar-valor-do-cliente-no-pedido>
Em vez de fazer <code>supabase.from("pedidos").update(...)</code> direto no front (que depende de permissões), vamos criar um método seguro no backend para “confirmar PIX do cliente” e gravar o valor:

Opção recomendada (mais segura):
- Criar uma função no banco (SECURITY DEFINER) do tipo <code>confirm_direct_pix_payment</code> que:
  - recebe <code>pedido_id</code>, <code>valor</code>, <code>session_id</code> (e opcionalmente <code>cliente_id</code>)
  - valida:
    - pedido existe
    - pedido está em <code>aguardando_pix</code>
    - <code>session_id</code> confere com o pedido (ou <code>cliente_id</code> confere para usuário logado)
    - <code>valor &gt;= 1</code>
  - faz update apenas de <code>valor</code> e <code>status</code> para <code>aguardando_confirmacao_pix</code>
  - retorna sucesso/erro.
- O frontend (TwoStepPixPaymentDialog) passa a chamar <code>supabase.rpc("confirm_direct_pix_payment", ...)</code> no clique “Já fiz o PIX”.

Por que isso resolve:
- Não depende de abrir UPDATE geral em <code>pedidos</code> para qualquer cliente/sessão.
- Mantém segurança (evita que um cliente malicioso altere outros campos do pedido).
</passo-2-corrigir-a-forma-de-gravar-valor-do-cliente-no-pedido>

<passo-3-garantir-que-o-painel-crie-a-gorjeta-sempre-que-houver-valor>
No painel do artista:
- Manter o fluxo atual de confirmação, mas vou ajustar para usar SEMPRE o valor “fresco” do banco (isso já existe) e, se por algum motivo o pedido estiver sem valor, exibir uma ação clara para o artista (ex.: “Definir valor manualmente antes de confirmar”), em vez de apenas “Marcar como pendente”.

Resultado:
- Quando houver valor, a gorjeta será criada e aparecerá no histórico, somando em “Total” e no “Recebido”.
</passo-3-garantir-que-o-painel-crie-a-gorjeta-sempre-que-houver-valor>

<passo-4-observabilidade-para-parar-o-loop-de-incerteza>
Para ter certeza absoluta que ficou correto, vou adicionar logs e feedbacks mínimos:
- No fluxo do cliente: log/Toast com o <code>pedidoId</code> e valor gravado ao confirmar.
- No fluxo do artista: após confirmar, retornar o ID da gorjeta criada (fazendo o insert com <code>.select()</code> quando possível) e logar/mostrar “Gorjeta registrada: R$ X,XX”.

Assim conseguimos provar que:
- o pedido recebeu o valor,
- a gorjeta foi criada,
- e o dashboard vai somar (porque ele soma a partir da tabela de gorjetas aprovadas).
</passo-4-observabilidade-para-parar-o-loop-de-incerteza>
</plano-de-implementacao>

<arquivos-que-devem-ser-alterados>
- Backend (migração): criar função SQL <code>confirm_direct_pix_payment</code> (e permissões necessárias para RPC).
- <code>src/components/TwoStepPixPaymentDialog.tsx</code>: trocar <code>update</code> direto por <code>rpc("confirm_direct_pix_payment")</code>.
- <code>src/pages/ArtistPanel.tsx</code> (opcional/melhoria): UX quando o valor está ausente + reforço no pós-confirmação.
- <code>src/hooks/useArtistPedidos.ts</code> (pequeno ajuste): idealmente retornar a gorjeta criada (insert com select) e logar o ID, para facilitar debug e garantir atualização de UI.
</arquivos-que-devem-ser-alterados>

<criterios-de-aceite>
1) Cliente faz fluxo PIX 2 etapas, informa valor, clica “Já fiz o PIX” e o pedido fica com status “aguardando_confirmacao_pix” e valor preenchido.
2) Artista abre /painel → aba PIX → clica “Confirmar R$ X,XX”.
3) Imediatamente:
   - aparece nova gorjeta no Histórico,
   - os cards do topo somam (Total/Recebido),
   - o pedido sai da fila de confirmação.
</criterios-de-aceite>

<riscos-e-cuidados>
- Não vou liberar UPDATE amplo em <code>pedidos</code> para clientes/sessão (isso abriria brecha para alterar música/mensagem/status). A solução via função do banco permite controlar exatamente o que pode mudar.
</riscos-e-cuidados>
