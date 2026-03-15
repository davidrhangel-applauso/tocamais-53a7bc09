

## Problema

O `TOAST_REMOVE_DELAY` em `src/hooks/use-toast.ts` está definido como **1.000.000ms (~16 minutos)**. Por isso os toasts ficam na tela praticamente para sempre, bloqueando a navegação no mobile.

## Correção

**Arquivo:** `src/hooks/use-toast.ts`

- Alterar `TOAST_REMOVE_DELAY` de `1000000` para `4000` (4 segundos) — tempo padrão razoável para notificações.

Correção de uma linha apenas.

