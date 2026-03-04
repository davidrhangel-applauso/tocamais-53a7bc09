

## Adicionar edição de perfil ao painel do estabelecimento

### Problema
A página de Configurações (`Settings.tsx`) é exclusiva para artistas -- quase todos os campos (PIX, estilo musical, redes sociais, status ao vivo) são condicionados a `profile.tipo === "artista"`. Estabelecimentos não têm como editar nome, foto, bio, endereço ou telefone de dentro do painel.

### Solução

Adicionar uma nova aba **"Perfil"** ao `EstabelecimentoPanel.tsx` com formulário de edição inline. Os campos já existem na tabela `profiles` do banco de dados (não é necessário criar migrações).

```text
Tabs do Estabelecimento (6 abas):
[ Pedidos ] [ Relatórios ] [ Perfil ] [ Avaliações ] [ Histórico ] [ QR Code ]
                             ↑ NOVO
```

### Campos editáveis na aba Perfil

| Campo | Tipo | Já existe no banco |
|---|---|---|
| Nome | Input text | sim (`nome`) |
| Bio / Descrição | Textarea | sim (`bio`) |
| Foto de perfil | AvatarUpload (componente existente) | sim (`foto_url`) |
| Foto de capa | CoverPhotoUpload (componente existente) | sim (`foto_capa_url`) |
| Cidade | Input text | sim (`cidade`) |
| Endereço completo | Input text | sim (`endereco`) |
| Telefone | Input text | sim (`telefone`) |
| Tipo de estabelecimento | Select (bar, restaurante, casa_noturna, etc.) | sim (`tipo_estabelecimento`) |

### Detalhes técnicos

**Arquivo modificado: `src/pages/EstabelecimentoPanel.tsx`**

1. Adicionar estados para edição do perfil (`editProfile`, `saving`)
2. Adicionar a aba "Perfil" na `TabsList` (mudar grid de 5 para 6 colunas)
3. Criar `TabsContent value="perfil"` com:
   - `AvatarUpload` (importado de `@/components/AvatarUpload`)
   - `CoverPhotoUpload` (importado de `@/components/CoverPhotoUpload`)
   - Campos de texto para nome, bio, cidade, endereco, telefone
   - Select para `tipo_estabelecimento`
   - Botão "Salvar" que faz `supabase.from('profiles').update(...)` nos campos editados
4. Após salvar, atualizar o estado `profile` local para refletir as mudanças no header
5. Adicionar import de `Pencil` (ou `Edit`) do lucide-react para o ícone da aba

**Nenhuma migração necessária** -- todos os campos já existem na tabela `profiles`.

**Componentes reutilizados** (zero código novo de upload):
- `AvatarUpload` -- já trata upload para storage e retorna URL
- `CoverPhotoUpload` -- idem para foto de capa

