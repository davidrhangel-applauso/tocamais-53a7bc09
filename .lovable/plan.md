

## Corrigir Notificacoes + Esclarecer Fluxo de Gorjetas

### 1. Corrigir clique nas notificacoes

**Problema:** O `e.preventDefault()` no `onSelect` impede o dropdown de fechar, e a combinacao com o comportamento do Radix UI bloqueia a navegacao.

**Solucao:** Usar um estado controlado para o dropdown (`open`/`onOpenChange`) e fechar o dropdown programaticamente antes de navegar.

**Arquivo: `src/components/NotificationBell.tsx`**
- Adicionar estado `open` para controlar o dropdown
- No `onSelect`, fechar o dropdown e depois executar a navegacao com um pequeno delay

```typescript
const [open, setOpen] = useState(false);

// No DropdownMenu:
<DropdownMenu open={open} onOpenChange={setOpen}>

// No DropdownMenuItem:
onSelect={(e) => {
  e.preventDefault();
  setOpen(false);
  setTimeout(() => handleNotificationClick(notification), 100);
}}
```

### 2. Fluxo de recebimento de gorjetas pelos artistas

**Situacao atual:** Com a migracao para Stripe, todo o dinheiro das gorjetas e depositado na conta Stripe da plataforma (a sua). Nao ha mecanismo automatico para transferir os valores aos artistas.

**Opcoes disponiveis:**

- **Opcao A - Transferencia Manual:** Voce visualiza as gorjetas no painel admin e faz transferencias manuais (PIX/bancaria) para os artistas. Simples, mas trabalhoso.

- **Opcao B - Stripe Connect (recomendado para escala):** Cada artista cria uma conta Stripe conectada. O Stripe automaticamente divide o pagamento: a taxa da plataforma (20% para Free, 0% para Pro) fica com voce e o restante vai direto para o artista. Requer que cada artista faca um onboarding no Stripe.

Neste plano, vou implementar apenas a **correcao das notificacoes**. A questao do fluxo de pagamento para artistas e uma decisao de negocio que precisa ser discutida separadamente.

### Detalhes tecnicos

**Arquivo modificado:** `src/components/NotificationBell.tsx`
- Importar `useState` do React
- Adicionar estado controlado `open` para o `DropdownMenu`
- No `onSelect` do `DropdownMenuItem`: fechar dropdown, depois navegar com delay

Nenhuma alteracao no hook `useNotifications.tsx` e necessaria - a logica de same-route scroll ja esta correta.
