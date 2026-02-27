

## Criar páginas de Termos de Uso e Política de Privacidade

### Arquivos a criar

1. **`src/pages/TermosDeUso.tsx`** — Página com termos de uso adequados à LGPD, cobrindo: uso da plataforma, responsabilidades, pagamentos/gorjetas, propriedade intelectual, limitação de responsabilidade.

2. **`src/pages/PoliticaPrivacidade.tsx`** — Página com política de privacidade LGPD, cobrindo: dados coletados, finalidade, compartilhamento, segurança, direitos do titular, cookies, contato do encarregado (DPO).

### Arquivos a modificar

3. **`src/App.tsx`** — Adicionar rotas `/termos` e `/privacidade`.

4. **`src/components/landing/LandingFooter.tsx`** — Adicionar links "Termos de Uso" e "Política de Privacidade" no bloco de links.

5. **`src/components/sales/SalesFooter.tsx`** — Corrigir link "Termos de Uso" de `/instrucoes` para `/termos`, adicionar link de privacidade.

