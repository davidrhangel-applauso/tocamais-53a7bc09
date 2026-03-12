

## Plano: Melhorar Tela do Estabelecimento + Gorjeta + Avaliação

### 1. Corrigir erro de build (`@lovable.dev/cloud-auth-js`)
O pacote já está no `package.json` mas não está sendo resolvido. Será reinstalado para corrigir o TypeScript error.

### 2. Redesign da página `EstabelecimentoProfile.tsx`
Baseado na screenshot e no pedido do usuário, a tela será reorganizada com layout mais intuitivo:

- **Header**: Manter cover photo + info do estabelecimento (já funciona bem)
- **Artista no Palco**: Card com foto, nome, estilo, redes sociais, e **botão de gorjeta** proeminente
- **Repertório**: Manter como está, com busca e seleção
- **Pedir Música**: Formulário simplificado — ao clicar numa música do repertório, já preenche o campo
- **Botão de Gorjeta**: Adicionar botão "Enviar Gorjeta" que abre o `TwoStepPixPaymentDialog` (mesmo componente usado no perfil do artista). Precisa buscar a PIX info do artista checado.
- **Avaliação**: Adicionar botão visível "Avaliar" (não só quando o checkin termina) — permitir avaliação durante e após a apresentação. Adicionar tab/seção para avaliar também o **estabelecimento** (atualmente só avalia o artista).

### 3. Gorjeta para o artista na tela do estabelecimento
- Buscar `artist_pix_info` do artista com check-in ativo usando a RPC `get_artist_pix_info`
- Reutilizar `TwoStepPixPaymentDialog` já existente
- Botão "Enviar Gorjeta" ao lado do artista no palco com badge "0% taxa"

### 4. Avaliação do artista E do estabelecimento
- Modificar `RatingDialog` para ter duas seções/tabs: avaliação do artista + avaliação do estabelecimento
- Criar tabela `avaliacoes_estabelecimentos` no banco para armazenar avaliações de estabelecimentos
- Adicionar botão "Avaliar" visível na tela (não apenas popup automático)
- O botão fica disponível quando há artista tocando ou recém-concluído

### 5. Migração de banco de dados
Nova tabela `avaliacoes_estabelecimentos`:
- `id`, `estabelecimento_id`, `cliente_id`, `session_id`, `nota`, `comentario`, `created_at`
- RLS: anônimos e autenticados podem inserir; estabelecimentos e admins podem ver

### Resumo das mudanças por arquivo
- **DB Migration**: Criar tabela `avaliacoes_estabelecimentos`
- **`src/pages/EstabelecimentoProfile.tsx`**: Redesign completo — adicionar gorjeta, avaliação, layout melhorado
- **`src/components/RatingDialog.tsx`**: Estender para suportar avaliação do estabelecimento (duas etapas ou tabs)
- **`src/integrations/lovable/index.ts`**: Reinstalar dependência para corrigir build

