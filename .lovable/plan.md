

## Corrigir clique nas notificacoes de gorjeta

### Problema
Dois problemas combinados:
1. O `DropdownMenuItem` do Radix interfere com o `onClick` — o evento `onSelect` fecha o dropdown antes do click ser processado corretamente
2. Quando o usuario ja esta na rota `/painel`, o `navigate("/painel")` do React Router nao faz nada (mesma rota)

### Solucao

**Arquivo: `src/components/NotificationBell.tsx`**
- Adicionar `onSelect` no `DropdownMenuItem` para garantir que a acao execute antes do dropdown fechar
- Usar `window.location` ou forcar re-render quando o link aponta para a rota atual

**Arquivo: `src/hooks/useNotifications.tsx`**
- Ajustar `handleNotificationClick` para lidar com o caso de navegacao para a mesma rota
- Se o link for a rota atual, forcar um scroll to top ou dispatch de evento para destacar a gorjeta relevante

### Detalhes tecnicos

No `NotificationBell.tsx`, trocar o `onClick` por `onSelect` no `DropdownMenuItem`:
```typescript
<DropdownMenuItem
  onSelect={(e) => {
    e.preventDefault();
    handleNotificationClick(notification);
  }}
>
```

No `useNotifications.tsx`, ajustar a navegacao para funcionar mesmo na mesma rota:
```typescript
const handleNotificationClick = (notification: Notification) => {
  markAsRead(notification.id);
  if (notification.link) {
    if (window.location.pathname === notification.link) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(notification.link);
    }
  }
};
```

Isso garante que:
- O clique funciona corretamente dentro do dropdown
- Se o usuario ja esta na pagina, faz scroll pro topo
- A notificacao e marcada como lida em todos os casos

