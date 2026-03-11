# ✅ Checklist de Produção - TocaMais

## 🎯 Status Atual

### ✅ Já Configurado
- [x] Banco de dados configurado (Lovable Cloud)
- [x] Autenticação implementada
- [x] Sistema de gorjetas com PIX direto
- [x] Assinaturas PRO via Stripe
- [x] PWA configurado

---

## 1. 🚀 Publicar o Frontend

### Passos:
1. Clique no botão **"Publish"** no canto superior direito
2. Revise as mudanças
3. Clique em **"Update"** para publicar
4. Seu app estará disponível em: `tocamais.lovable.app`

**Importante**: O backend (edge functions) já está automaticamente em produção!

---

## 2. 🧪 Testar Fluxo Completo em Produção

### Checklist de Testes:

#### Teste 1: Cadastro de Artista
- [ ] Criar conta como artista
- [ ] Preencher perfil completo (nome, bio, foto, cidade, estilo musical)
- [ ] Adicionar músicas ao repertório
- [ ] Ativar status "ao vivo"

#### Teste 2: Pagamento de Gorjeta via PIX Direto
- [ ] Abrir perfil de artista
- [ ] Enviar gorjeta com pedido de música
- [ ] Confirmar pagamento PIX
- [ ] Verificar se gorjeta aparece no painel do artista

#### Teste 3: Pedido de Música
- [ ] Fazer pedido de música
- [ ] Verificar se artista recebe notificação
- [ ] Artista aceitar/recusar pedido

#### Teste 4: Assinatura PRO via Stripe
- [ ] Artista iniciar checkout PRO
- [ ] Completar pagamento no Stripe
- [ ] Verificar se plano muda para PRO
- [ ] Verificar se taxa 0% é aplicada

---

## 3. 🌐 Domínio Customizado (Opcional)

Se quiser usar seu próprio domínio (ex: `tocamais.com.br`):
1. Vá em Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

---

## 4. 👥 Cadastrar Artistas Reais

### Como cadastrar:

**Opção 1: Artistas se cadastram sozinhos**
- Compartilhe o link do app publicado
- Artistas criam conta e preenchem perfil

**Opção 2: Você cadastra manualmente**
- Crie contas para cada artista
- Preencha perfis completos

---

## 5. 🔒 Segurança e Conformidade

- [x] RLS (Row Level Security) ativo em todas as tabelas
- [x] Autenticação obrigatória para ações sensíveis
- [x] Secrets armazenados com segurança

---

## 6. 📈 Monitoramento Pós-Lançamento

### Métricas para acompanhar:

1. **Backend/Logs** - Monitore erros nos edge functions
2. **Banco de Dados** - Verifique gorjetas e pagamentos
3. **Stripe Dashboard** - Acompanhe assinaturas PRO

---

**Última atualização**: Março 2026
