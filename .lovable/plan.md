

## Plano: Seção de Configurações PIX no Painel Admin

### O que será feito

Criar uma nova aba "Configurações" no painel admin com formulário para gerenciar os dados PIX de recebimento das assinaturas.

### Mudanças

| Componente | Mudança |
|---|---|
| `src/components/AdminSettings.tsx` (novo) | Formulário com campos: chave PIX, tipo da chave (CPF/CNPJ/email/telefone/aleatória), nome do recebedor, cidade, e valores de cada plano (mensal, anual, bienal). Busca dados existentes da tabela `admin_settings` ao montar e faz upsert ao salvar. |
| `src/components/AdminSidebar.tsx` | Adicionar item "Configurações" com ícone `Settings` (já importado) no menu |
| `src/pages/Admin.tsx` | Adicionar case `"configuracoes"` no `renderContent()` e `getPageTitle()`, importar `AdminSettings` |

### Campos do formulário

- **Chave PIX** (`subscription_pix_key`) - input text
- **Tipo da Chave** (`subscription_pix_key_type`) - select: CPF, CNPJ, Email, Telefone, Aleatória
- **Nome do Recebedor** (`subscription_pix_name`) - input text (max 25 chars)
- **Cidade** (`subscription_pix_city`) - input text (max 15 chars)
- **Valor Mensal** (`subscription_price_mensal`) - input number
- **Valor Anual** (`subscription_price_anual`) - input number
- **Valor Bienal** (`subscription_price_bienal`) - input number

### Lógica

O componente `AdminSettings` usa as setting keys existentes na tabela `admin_settings`. Ao carregar, busca todas as settings com prefixo `subscription_`. Ao salvar, faz upsert (insert on conflict update) para cada campo via chamadas individuais ao Supabase. As políticas RLS já permitem que admins façam CRUD na tabela `admin_settings`.

Sem migração necessária -- a tabela `admin_settings` já existe com a estrutura correta (key/value).

