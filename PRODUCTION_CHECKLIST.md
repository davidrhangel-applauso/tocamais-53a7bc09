# ✅ Checklist de Produção - Preparar App para Artistas Reais

## 🎯 Status Atual

### ✅ Já Configurado
- [x] Banco de dados configurado (Lovable Cloud)
- [x] Autenticação implementada
- [x] Sistema de gorjetas com Pix
- [x] Secrets do Mercado Pago configurados
- [x] **Client ID do Mercado Pago adicionado** ✨
- [x] Split de pagamentos implementado
- [x] CPF obrigatório para maximizar pontuação
- [x] Webhook do Mercado Pago configurado

### 🔄 Precisa Fazer

## 1. 🏦 Mercado Pago em Produção

**Status**: ⚠️ **PRÓXIMO PASSO CRÍTICO**

### ✅ Passo 1.1: Client ID Configurado
- [x] Client ID adicionado ao sistema
- [x] Botão "Vincular Conta do Mercado Pago" já funciona

### ⚠️ Passo 1.2: Configurar Redirect URI no Mercado Pago
**FAÇA AGORA**: 
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em **"Redirect URIs"** ou **"URLs de redirecionamento"**
4. Adicione esta URL EXATA:
   ```
   https://tnhbijlskoffgoocftfq.supabase.co/functions/v1/mercadopago-oauth-callback
   ```
5. Salve as alterações

### ⚠️ Passo 1.3: Verificar se Credenciais são de PRODUÇÃO
**IMPORTANTE**: Confirme que os secrets foram configurados com credenciais de **PRODUÇÃO** (não Sandbox):

1. No Mercado Pago, verifique se está em **"Credenciais de Produção"**
2. Credenciais de produção começam com:
   - Access Token: `APP_USR-` (não `TEST-`)
   - Client ID: número longo
   - Client Secret: string alfanumérica longa

3. **Se você usou credenciais de TESTE/SANDBOX**, atualize os secrets:
   - Vá em Settings → Cloud → Secrets
   - Atualize com valores de PRODUÇÃO:
     - `MERCADO_PAGO_ACCESS_TOKEN`
     - `MERCADO_PAGO_CLIENT_ID`
     - `MERCADO_PAGO_CLIENT_SECRET`
     - `VITE_MERCADO_PAGO_CLIENT_ID`

### ⏭️ Passo 1.4: Ativar Modo Produção (Depois dos testes)
   - No painel da aplicação, clique em "Ativar produção"
   - Complete os requisitos:
     - Fazer 5-10 pagamentos de teste em produção
     - Atingir 73+ pontos de qualidade (já otimizado!)
     - Preencher dados da empresa
   - Aguarde aprovação (1-3 dias úteis)

### ⏭️ Passo 1.5: Configurar Webhook (se ainda não feito)
   - No Mercado Pago, vá em Configurações → Webhooks
   - Adicione a URL:
     ```
     https://tnhbijlskoffgoocftfq.supabase.co/functions/v1/mercadopago-webhook
     ```
   - Copie o **Secret** do webhook
   - Adicione como secret `MERCADO_PAGO_WEBHOOK_SECRET` no Lovable (se necessário)

---

## 2. 🚀 Publicar o Frontend

**Status**: ⚠️ Necessário publicar

### Passos:
1. Clique no botão **"Publish"** no canto superior direito
2. Revise as mudanças
3. Clique em **"Update"** para publicar
4. Seu app estará disponível em: `[seu-dominio].lovable.app`

**Importante**: O backend (edge functions) já está automaticamente em produção!

---

## 3. 🧪 Testar Fluxo Completo em Produção

**Status**: ⚠️ Necessário testar

### Checklist de Testes:

#### Teste 1: Cadastro de Artista
- [ ] Criar conta como artista
- [ ] Preencher perfil completo (nome, bio, foto, cidade, estilo musical)
- [ ] Adicionar músicas ao repertório
- [ ] Ativar status "ao vivo"
- [ ] Vincular conta do Mercado Pago

#### Teste 2: Pagamento de Gorjeta (Cliente Autenticado)
- [ ] Criar conta como cliente
- [ ] Buscar artista
- [ ] Enviar gorjeta com nome e CPF válidos
- [ ] Escanear QR Code Pix
- [ ] Verificar se pagamento é aprovado
- [ ] Verificar se artista recebe 90% (split funcionando)
- [ ] Verificar se gorjeta aparece no histórico

#### Teste 3: Pagamento de Gorjeta (Cliente Anônimo)
- [ ] Abrir perfil de artista sem login
- [ ] Enviar gorjeta com nome e CPF válidos
- [ ] Pagar via Pix
- [ ] Verificar se pagamento funciona

#### Teste 4: Pedido de Música
- [ ] Fazer pedido de música com gorjeta
- [ ] Verificar se artista recebe notificação
- [ ] Artista aceitar/recusar pedido

#### Teste 5: Verificar Split de Pagamento
- [ ] Fazer pagamento de R$ 10,00
- [ ] Verificar se R$ 9,00 (90%) vai para conta do artista
- [ ] Verificar se R$ 1,00 (10%) fica com a plataforma
- [ ] Conferir no extrato do Mercado Pago do artista

---

## 4. 📊 Atingir Pontuação Mercado Pago (73+ pontos)

**Status**: ✅ Integração já otimizada

### Como ganhar pontos:

#### Já Implementado (automático):
- ✅ **Dados completos do pagador** (até 25 pontos)
  - Nome completo obrigatório
  - CPF obrigatório com validação
- ✅ **External Reference** (10 pontos)
- ✅ **Statement Descriptor** (5 pontos)
- ✅ **Tratamento de erros** (10 pontos)

#### Você precisa fazer:
1. **Fazer 5-10 pagamentos de teste em produção** (30-40 pontos)
   - Use valores baixos (R$ 1,00 - R$ 5,00)
   - Preencha todos os campos
   - Complete os pagamentos

2. **Acessar painel de qualidade**:
   - Mercado Pago → Suas integrações → Qualidade da integração
   - Verifique os pontos
   - Siga recomendações adicionais se houver

---

## 5. 🌐 Domínio Customizado (Opcional)

**Status**: ⏭️ Opcional

Se quiser usar seu próprio domínio (ex: `minhaapp.com.br`):

1. Vá em Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções
4. **Requer plano pago do Lovable**

---

## 6. 👥 Cadastrar Artistas Reais

**Status**: ⏭️ Pronto após passos anteriores

### Como cadastrar:

**Opção 1: Artistas se cadastram sozinhos**
- Compartilhe o link do app publicado
- Artistas criam conta e preenchem perfil
- Você pode destacar artistas manualmente no banco de dados

**Opção 2: Você cadastra manualmente**
- Crie contas para cada artista
- Preencha perfis completos
- Configure status e destaques

### Dados importantes para coletar:
- Nome artístico
- Biografia
- Foto profissional
- Cidade
- Estilo musical
- Redes sociais (Instagram, YouTube, Spotify)
- Repertório (músicas que tocam)
- Conta Mercado Pago para vincular

---

## 7. 🔒 Segurança e Conformidade

**Status**: ✅ Já configurado

- [x] RLS (Row Level Security) ativo em todas as tabelas
- [x] Autenticação obrigatória para ações sensíveis
- [x] Secrets armazenados com segurança
- [x] CPF validado antes do pagamento
- [x] Webhook verificado com assinatura

---

## 8. 📈 Monitoramento Pós-Lançamento

### Métricas para acompanhar:

1. **Backend/Logs**
   - Acesse: Settings → Cloud → Functions
   - Monitore erros nos edge functions
   - Verifique logs de pagamentos

2. **Banco de Dados**
   - Acesse: Settings → Cloud → Database
   - Verifique gorjetas criadas
   - Confira status de pagamentos

3. **Mercado Pago**
   - Dashboard do Mercado Pago
   - Verifique transações
   - Monitore splits de pagamento

---

## 📋 Resumo: Ordem de Execução

```
1. ✅ Client ID configurado

2. ⚠️ **AGORA**: Configurar Redirect URI no Mercado Pago
   └─ https://tnhbijlskoffgoocftfq.supabase.co/functions/v1/mercadopago-oauth-callback

3. ⚠️ **AGORA**: Verificar se secrets são de PRODUÇÃO
   └─ Access Token deve começar com APP_USR- (não TEST-)

4. 🚀 Publicar o frontend
   └─ Clicar em "Publish" → "Update"

5. 🧪 Testar fluxo completo
   ├─ Cadastro de artista
   ├─ Pagamento de gorjeta
   ├─ Verificar split
   └─ Pedido de música

6. 👥 Cadastrar artistas reais
   └─ Compartilhar link ou cadastrar manualmente

7. 📊 Monitorar e ajustar
```

---

## 🆘 Precisa de Ajuda?

### Problemas Comuns:

**"Não consigo vincular Mercado Pago"**
- Verifique se Redirect URI está configurada
- Confirme que aplicação está em modo produção
- Verifique se secrets estão atualizados

**"Split não está funcionando"**
- Confirme que artista vinculou conta Mercado Pago
- Verifique se aplicação está em produção (não sandbox)
- Confira logs do edge function `create-pix-payment`

**"Pagamento não muda status"**
- Verifique se webhook está configurado
- Confira logs do edge function `mercadopago-webhook`
- Teste webhook no painel do Mercado Pago

### Recursos:
- 📘 [Guia Mercado Pago](./MERCADOPAGO_SETUP.md)
- 🔗 [Painel Mercado Pago](https://www.mercadopago.com.br/developers/panel)
- 🏗️ [Lovable Docs](https://docs.lovable.dev)

---

## ✨ Próximas Funcionalidades (Futuro)

Após o lançamento, você pode adicionar:
- 📧 Notificações por email
- 📱 Notificações push
- 💰 Dashboard de receitas para artistas
- ⭐ Sistema de avaliações
- 🎫 Venda de ingressos
- 🔔 Alertas quando artista entra ao vivo
- 📊 Analytics detalhados
- 🏆 Sistema de recompensas/badges

---

**Última atualização**: Novembro 2025
