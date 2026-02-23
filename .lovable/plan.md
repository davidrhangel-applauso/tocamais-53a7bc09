

## Navegacao mobile completa com botao "Mais"

### Problema
O painel tem ~10 abas (Pendentes, Aceitos, Concluidos, Recusados, Gorjetas, Historico, Repertorio, Setlists, + PIX e Local condicionais), mas a barra inferior mobile so mostra 5. As abas "Concluidos", "Recusados" e "Historico" ficam inacessiveis no celular.

### Solucao proposta

Manter as 4 abas mais importantes fixas na barra inferior e adicionar um botao **"Mais"** que abre um **Drawer** (menu deslizante de baixo para cima) com todas as demais abas.

```text
Barra inferior (sempre visivel):
[ Pendentes ] [ Aceitos ] [ Gorjetas ] [ Repertorio ] [ ••• Mais ]

Drawer "Mais" (abre ao tocar):
  - Concluidos (12)
  - Recusados (4)
  - Historico
  - Setlists
  - PIX (se houver)
  - Local (se houver)
```

Vantagens:
- Nao sobrecarrega a barra inferior
- Todas as abas ficam acessiveis
- Usa o componente Drawer que ja existe no projeto (vaul)
- Badges com contadores continuam visiveis nos itens do drawer

### Detalhes tecnicos

**Arquivo a modificar: `src/components/MobileBottomNav.tsx`**

Mudancas:
1. Reduzir `mainNavItems` para 4 itens fixos: Pendentes, Aceitos, Gorjetas, Repertorio
2. Mover os demais (Concluidos, Recusados, Historico, Setlists, PIX, Local) para um array `moreItems`
3. Adicionar um 5o botao "Mais" (icone `MoreHorizontal`) que abre um `Drawer`
4. Dentro do Drawer, listar os itens extras como botoes com icone + label + badge
5. Ao selecionar um item do Drawer, fechar o drawer e navegar para a aba
6. Destacar visualmente se a aba ativa atual esta dentro do "Mais" (icone do "Mais" fica com cor primaria)

**Props adicionais necessarias:**
- `concluidos: number` (ja existe como opcional, tornar obrigatorio para mostrar badge)
- `recusados: number` (idem)
- `activeCheckin?: boolean` (para mostrar aba Local condicionalmente)
- `pedidosLocal?: number` (contagem para badge do Local)

**Nenhum arquivo novo necessario** - o Drawer ja esta em `src/components/ui/drawer.tsx`.

