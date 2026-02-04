

## Plano: Adicionar Coluna de Email no Painel Admin

### Objetivo
Exibir o email de cada usuario (artistas e estabelecimentos) nas tabelas do painel administrativo, usando uma funcao segura do banco de dados que apenas administradores podem acessar.

### Situacao Atual
- As tabelas de artistas e estabelecimentos no painel admin mostram dados do `profiles`
- Emails dos usuarios estao na tabela `auth.users`, que e protegida e nao acessivel diretamente pelo cliente
- Nao existe funcao para buscar emails de forma segura

### Solucao Proposta
Criar uma funcao PostgreSQL com `SECURITY DEFINER` que permite apenas administradores consultarem emails dos usuarios, e integrar essa informacao nas tabelas do painel admin.

### Mudancas Tecnicas

**1. Criar Funcao SQL `get_user_emails_for_admin`**
   - Funcao com `SECURITY DEFINER` que consulta `auth.users`
   - Recebe um array de UUIDs e retorna os emails correspondentes
   - Verifica se o solicitante e admin antes de retornar dados
   - Se nao for admin, retorna vazio (seguranca)

```sql
CREATE OR REPLACE FUNCTION public.get_user_emails_for_admin(user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas admins podem acessar emails
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT au.id, au.email::text
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;
```

**2. Atualizar `src/components/AdminEstabelecimentos.tsx`**
   - Adicionar estado para armazenar emails: `emailMap`
   - Apos buscar estabelecimentos, chamar a funcao RPC para buscar emails
   - Adicionar coluna "Email" na tabela
   - Exibir email ao lado do nome do estabelecimento

**3. Atualizar `src/pages/Admin.tsx`**
   - Na secao de artistas, adicionar mesma logica de busca de emails
   - Adicionar coluna "Email" na tabela de artistas
   - Exibir email junto com o nome do artista

### Layout Proposto das Tabelas

**Tabela de Artistas:**
```text
| Artista          | Email                  | Cidade | Estilo | Plano | Status | Acoes |
|------------------|------------------------|--------|--------|-------|--------|-------|
| [Avatar] Nome    | artista@email.com      | SP     | Rock   | PRO   | Online | [...]  |
| ID: abc-123      |                        |        |        |       |        |       |
```

**Tabela de Estabelecimentos:**
```text
| Estabelecimento  | Email                  | Cidade | Tipo       | Endereco | Acoes |
|------------------|------------------------|--------|------------|----------|-------|
| [Avatar] Nome    | local@email.com        | RJ     | Bar        | Rua X    | [...]  |
| ID: xyz-789      |                        |        |            |          |       |
```

### Fluxo de Dados

```text
1. Admin abre aba "Artistas" ou "Estabelecimentos"
          |
          v
2. Componente busca profiles da tabela `profiles`
          |
          v
3. Apos receber IDs, chama `supabase.rpc('get_user_emails_for_admin', { user_ids: [...] })`
          |
          v
4. Funcao SQL verifica se chamador e admin via `is_admin(auth.uid())`
          |
          v
5. Se admin: retorna emails | Se nao: retorna vazio
          |
          v
6. Frontend monta mapa id -> email e exibe na tabela
```

### Arquivos a Modificar/Criar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| Migracao SQL | Criar | Funcao `get_user_emails_for_admin` |
| `src/components/AdminEstabelecimentos.tsx` | Editar | Adicionar coluna email e busca via RPC |
| `src/pages/Admin.tsx` | Editar | Adicionar coluna email na tabela de artistas |

### Seguranca
- Funcao usa `SECURITY DEFINER` para acessar `auth.users`
- Verificacao de admin obrigatoria antes de retornar dados
- Se usuario nao for admin, funcao retorna resultado vazio
- Emails sao sensiveis mas admins precisam deste acesso para suporte

### Beneficios
- Admin visualiza emails para contato/suporte direto
- Busca de usuarios por email facilitada
- Dados protegidos - apenas admins tem acesso
- Arquitetura segura usando funcao SECURITY DEFINER

