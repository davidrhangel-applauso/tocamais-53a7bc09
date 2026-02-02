

## Plano: Criar um Painel Dedicado para Administradores

### Objetivo
Criar uma experiência de painel diferenciada para usuários administradores, mostrando apenas informações relevantes e pertinentes para a gestao da plataforma, ao inves de mostrar o painel de artistas.

### Situacao Atual
- A rota `/painel` sempre mostra o **ArtistPanel** (painel de artistas)
- O admin consegue acessar `/admin` para gerenciar a plataforma
- Quando um admin acessa `/painel`, ele ve o painel de artista (que nao faz sentido)
- Existe um link "Admin" na sidebar visivel apenas para admins

### Solucao Proposta
Redirecionar automaticamente usuarios admin da rota `/painel` para `/admin`, e reorganizar o painel administrativo para ser a "home" do admin com um layout mais intuitivo.

### Mudancas Tecnicas

**1. Modificar `src/pages/ArtistPanel.tsx`**
   - Adicionar verificacao de admin no `checkAuth`
   - Se o usuario for admin, redirecionar para `/admin` automaticamente
   - Isso garante que admins nunca vejam o painel de artistas

**2. Reorganizar `src/pages/Admin.tsx`**
   - Criar um dashboard inicial com metricas resumidas
   - Cards de acesso rapido:
     - Assinaturas pendentes (alerta visual se houver)
     - Total de artistas e estabelecimentos
     - Volume financeiro do periodo
     - Artistas ao vivo no momento
   - Manter as abas existentes (Artistas, Assinaturas, Financeiro)
   - Adicionar aba "Estabelecimentos" para gerenciar locais cadastrados
   - Melhorar a navegacao com um header mais limpo

**3. Criar `src/components/AdminSidebar.tsx`**
   - Sidebar dedicada para admins (similar ao AppSidebar dos artistas)
   - Links rapidos: Dashboard, Artistas, Estabelecimentos, Assinaturas, Financeiro
   - Acoes rapidas: Ver logs, Configuracoes

**4. Adicionar secao de Estabelecimentos ao Admin**
   - Listar todos os estabelecimentos cadastrados
   - Visualizar estatisticas de cada local
   - Opcao de editar/excluir

### Layout do Dashboard Admin

```text
+--------------------------------------------------+
| [Logo] Painel Administrativo      [Notificacoes] |
+--------------------------------------------------+
|        |                                         |
| MENU   |  [Card: Assinaturas Pendentes: 3]       |
|        |  [Card: Total Artistas: 15]             |
| - Dash |  [Card: Total Estabelecimentos: 2]      |
| - Art. |  [Card: Receita do Mes: R$ 500]         |
| - Est. |                                         |
| - Ass. |  +------------------------------------+ |
| - Fin. |  | TABELA: Ultimas atividades        | |
|        |  +------------------------------------+ |
| ----   |                                         |
| Sair   |                                         |
+--------------------------------------------------+
```

### Arquivos a Modificar/Criar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/ArtistPanel.tsx` | Editar | Adicionar redirect para admin |
| `src/pages/Admin.tsx` | Editar | Reorganizar com dashboard inicial |
| `src/components/AdminSidebar.tsx` | Criar | Sidebar dedicada para admin |
| `src/components/AdminDashboard.tsx` | Criar | Cards e metricas resumidas |
| `src/components/AdminEstabelecimentos.tsx` | Criar | Gerenciamento de estabelecimentos |

### Beneficios
- Admin tem experiencia dedicada e focada
- Acesso rapido as funcoes mais usadas (aprovar assinaturas)
- Visao geral da plataforma em um unico lugar
- Separacao clara entre perfil de artista e admin

