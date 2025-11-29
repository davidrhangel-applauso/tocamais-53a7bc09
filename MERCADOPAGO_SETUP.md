# 🔗 Guia Completo: Vincular Mercado Pago para Split de Pagamentos

## 📋 O que é o Split de Pagamentos?

O Split permite que você receba **90% do valor das gorjetas diretamente na sua conta do Mercado Pago**, sem precisar solicitar saques ou transferências manuais.

**Divisão:**
- 🎨 Artista recebe: **90%**
- 💼 Taxa da plataforma: **10%**

---

## 🚀 Passo a Passo para Ativar

### 1️⃣ Criar Aplicação no Mercado Pago

1. Acesse o [Painel de Desenvolvedores do Mercado Pago](https://www.mercadopago.com.br/developers/panel)
2. Faça login com sua conta do Mercado Pago
3. Clique em **"Criar aplicação"**
4. Escolha o tipo: **"Online payments"** (Pagamentos online)
5. Preencha os dados da aplicação:
   - Nome: `[Seu Nome] - Gorjetas`
   - Descrição: `Recebimento de gorjetas de apresentações ao vivo`

### 2️⃣ Configurar Redirect URI

Após criar a aplicação:

1. Vá em **Configurações** → **Redirect URIs**
2. Adicione a seguinte URL:
   ```
   https://tnhbijlskoffgoocftfq.supabase.co/functions/v1/mercadopago-oauth-callback
   ```
3. Clique em **Salvar**

⚠️ **Importante**: Esta URL deve ser exatamente como mostrado acima.

### 3️⃣ Coletar Credenciais

1. Na página da sua aplicação, vá em **Credenciais**
2. Copie:
   - **Client ID** (número longo, ex: 4085949071616879)
   - **Client Secret** (código longo com letras e números)
3. Guarde essas informações em um local seguro

### 4️⃣ Modo de Teste vs Produção

**🧪 Modo Sandbox (Teste)**
- Para testar a funcionalidade sem dinheiro real
- Não funciona para split de pagamentos reais
- Use para validar o fluxo

**✅ Modo Produção (Real)**
- Necessário para receber split de pagamentos
- Requer:
  - Mínimo de 5 pagamentos de teste
  - Pontuação de qualidade: 73+ pontos
  - Aprovação do Mercado Pago (pode levar alguns dias)

### 5️⃣ Solicitar Ativação em Produção

1. No painel de desenvolvedores, acesse sua aplicação
2. Vá em **"Ativar produção"**
3. Complete os requisitos:
   - ✅ Fazer 5 pagamentos de teste
   - ✅ Atingir pontuação mínima
   - ✅ Preencher informações da empresa/negócio
4. Aguarde aprovação (geralmente 1-3 dias úteis)

### 6️⃣ Configurar na Plataforma

Depois de ter o **Client ID** e **Client Secret**:

1. Entre em contato com o suporte da plataforma
2. Forneça:
   - Client ID
   - Client Secret
   - Confirmação de que a aplicação está em produção
3. Aguarde a configuração (geralmente em até 24h)

### 7️⃣ Vincular sua Conta

Após a configuração estar completa:

1. Acesse o **Painel do Artista**
2. Vá na aba **📊 Dashboard**
3. Localize o card **"Receber Split de Pagamentos"**
4. Clique em **"Vincular Conta do Mercado Pago"**
5. Será redirecionado para a página de autorização do Mercado Pago
6. Faça login e autorize a aplicação
7. Pronto! ✅

---

## 🧪 Modo de Teste (Enquanto Aguarda Aprovação)

Enquanto sua aplicação não está aprovada em produção, você pode usar o **Modo de Teste**:

1. No card de Split, clique em **"Ativar Modo de Teste"**
2. Isto simula o fluxo de split sem conexão real
3. Os pagamentos continuam indo para a plataforma
4. Útil para testar a interface e fluxo

---

## ❓ Problemas Comuns

### "Não consigo vincular a conta"

**Possíveis causas:**
1. ✋ Redirect URI não configurada corretamente
   - Verifique se a URL está exatamente como mostrado
2. ✋ Aplicação ainda em modo sandbox
   - O OAuth só funciona em produção
3. ✋ Client ID/Secret não configurados na plataforma
   - Entre em contato com o suporte

### "Erro ao autorizar"

**Soluções:**
1. Limpe o cache do navegador
2. Tente em uma janela anônima
3. Verifique se está logado na conta correta do Mercado Pago
4. Verifique se a Redirect URI está configurada

### "Vinculado mas não recebo split"

**Checklist:**
1. ✅ Conta vinculada no painel?
2. ✅ Aplicação em modo produção?
3. ✅ Fez um pagamento de teste?
4. ⏱️ Aguarde alguns minutos após vincular

---

## 💰 Como Funciona o Split

Quando alguém faz uma gorjeta de **R$ 10,00**:

```
Valor pago: R$ 10,00
↓
90% vai direto para você: R$ 9,00
10% fica com a plataforma: R$ 1,00
```

**Vantagens:**
- 💸 Dinheiro cai direto na sua conta
- ⚡ Disponível assim que o pagamento é aprovado
- 📊 Acompanhe em tempo real no painel
- 🚫 Sem burocracia de saques

---

## 📞 Suporte

Precisa de ajuda? Entre em contato:
- 📧 Email: suporte@plataforma.com.br
- 💬 Chat do WhatsApp: +55 (11) 99999-9999
- 🕐 Horário: Seg-Sex, 9h-18h

---

## 📚 Links Úteis

- [Painel de Desenvolvedores](https://www.mercadopago.com.br/developers/panel)
- [Documentação do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [FAQ sobre OAuth](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/security/oauth)
- [Status da API](https://status.mercadopago.com/)

---

**Última atualização:** Novembro 2025
