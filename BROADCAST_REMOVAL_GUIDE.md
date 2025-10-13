# 🗑️ Guia de Remoção Completa do Broadcast

## 📊 Recursos Identificados no Banco de Dados

### Tabelas (4)
- ✅ `broadcast_campaigns` - 19 colunas
- ✅ `broadcast_history` - 10 colunas
- ✅ `broadcast_queue` - 19 colunas
- ✅ `broadcast_rate_limits` - 8 colunas

### Funções (2 custom + 1 sistema)
- ✅ `public.create_broadcast_queue(uuid, uuid)`
- ✅ `public.get_user_broadcast_campaigns(uuid)`
- ⚠️ `realtime.broadcast_changes(...)` - **NÃO REMOVER** (função do sistema Supabase)

### Triggers (2)
- ✅ `update_broadcast_campaigns_updated_at`
- ✅ `update_broadcast_queue_updated_at`

### Policies RLS (10)
- ✅ 2 em broadcast_campaigns
- ✅ 2 em broadcast_history
- ✅ 2 em broadcast_queue
- ✅ 2 em broadcast_rate_limits
- ✅ 2 duplicadas (total 10)

### Foreign Keys (7)
- ✅ 1 em broadcast_campaigns → profiles
- ✅ 3 em broadcast_history → campaigns/leads/queue
- ✅ 3 em broadcast_queue → campaigns/instances/leads

### Índices (7+)
- ✅ idx_broadcast_rate_limits_unique
- ✅ idx_broadcast_campaigns_user
- ✅ idx_broadcast_campaigns_status
- ✅ idx_broadcast_queue_campaign
- ✅ idx_broadcast_queue_status
- ✅ idx_broadcast_queue_scheduled
- ✅ idx_broadcast_history_campaign

## 🎯 Plano de Execução

### FASE 1: Preparação ✅ CONCLUÍDO

- [x] Remover componentes frontend
- [x] Remover edge functions
- [x] Criar scripts SQL
- [x] Criar documentação

### FASE 2: Backup dos Dados (EXECUTAR AGORA)

**⚠️ IMPORTANTE: Execute o backup ANTES de qualquer remoção!**

```sql
-- No Supabase SQL Editor, execute:
\i backup_broadcast_data.sql

-- OU copie e cole o conteúdo do arquivo backup_broadcast_data.sql
```

**O que o script faz:**
1. ✅ Cria schema `broadcast_backup`
2. ✅ Copia TODOS os dados das 4 tabelas
3. ✅ Salva definições das funções
4. ✅ Exibe estatísticas do backup

**Estimativa de tempo:** 1-2 minutos

### FASE 3: Remoção da Estrutura

**⚠️ ATENÇÃO: Após executar, os dados serão PERMANENTEMENTE removidos!**

```sql
-- No Supabase SQL Editor, execute:
\i drop_broadcast_SAFE.sql

-- OU copie e cole o conteúdo do arquivo drop_broadcast_SAFE.sql
```

**O que o script faz (nesta ordem):**
1. ✅ Desabilita triggers temporariamente
2. ✅ Remove 10 policies RLS
3. ✅ Remove 2 triggers
4. ✅ Remove 2 funções custom
5. ✅ Remove 7 foreign keys
6. ✅ Remove 7+ índices
7. ✅ Remove 4 tabelas (ordem correta)
8. ✅ Reabilita triggers
9. ✅ Verifica se tudo foi removido
10. ✅ Exibe relatório final

**Estimativa de tempo:** 30 segundos

**Segurança:**
- ✅ Usa transação (BEGIN/COMMIT)
- ✅ Usa IF EXISTS em todos os comandos
- ✅ Verificação automática no final
- ✅ Ordem correta de remoção

### FASE 4: Verificação

Após executar o script de remoção, execute novamente o script de listagem:

```sql
\i list_broadcast_resources.sql
```

**Resultado esperado:** TODOS os comandos devem retornar 0 registros ou vazio.

### FASE 5: Build e Testes Frontend

```bash
# 1. Verificar build
npm run build

# 2. Se houver erros, corrigir imports quebrados

# 3. Testar aplicação
npm run dev

# 4. Verificar se a página de Automação carrega
```

### FASE 6: Commit das Mudanças

```bash
git add .
git commit -m "refactor: Remover funcionalidade completa de broadcast

BREAKING CHANGE: Funcionalidade de campanhas de disparo em massa removida

Frontend removido:
- 13 componentes de broadcast/campanha
- Hooks e serviços de broadcast
- Página Automation simplificada

Backend removido:
- 4 Edge functions (broadcast_*)
- 4 Tabelas (broadcast_campaigns, broadcast_queue, broadcast_history, broadcast_rate_limits)
- 2 Funções custom (create_broadcast_queue, get_user_broadcast_campaigns)
- 2 Triggers
- 10 Policies RLS
- 7 Foreign Keys
- 7+ Índices

Backup criado em schema broadcast_backup

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

## 📝 Comandos Rápidos

### Backup
```bash
# Via psql local
psql -h [host] -U postgres -d postgres -f backup_broadcast_data.sql

# Via Supabase Dashboard
# Copie e cole o conteúdo de backup_broadcast_data.sql no SQL Editor
```

### Remoção
```bash
# Via psql local
psql -h [host] -U postgres -d postgres -f drop_broadcast_SAFE.sql

# Via Supabase Dashboard
# Copie e cole o conteúdo de drop_broadcast_SAFE.sql no SQL Editor
```

### Verificação
```bash
# Via psql local
psql -h [host] -U postgres -d postgres -f list_broadcast_resources.sql

# Via Supabase Dashboard
# Copie e cole o conteúdo de list_broadcast_resources.sql no SQL Editor
```

## 🔄 Rollback (Se Necessário)

Se algo der errado durante a remoção:

### Opção 1: Rollback da Transação
```sql
-- Se ainda estiver dentro da transação:
ROLLBACK;
```

### Opção 2: Restaurar do Backup
```sql
-- 1. Primeiro, será necessário recriar as tabelas manualmente
-- (use as migrations antigas como referência)

-- 2. Depois restaure os dados:
INSERT INTO public.broadcast_campaigns
SELECT * FROM broadcast_backup.broadcast_campaigns;

INSERT INTO public.broadcast_queue
SELECT * FROM broadcast_backup.broadcast_queue;

INSERT INTO public.broadcast_history
SELECT * FROM broadcast_backup.broadcast_history;

INSERT INTO public.broadcast_rate_limits
SELECT * FROM broadcast_backup.broadcast_rate_limits;

-- 3. Recrie as funções usando:
SELECT definition FROM broadcast_backup.functions_backup;
```

### Opção 3: Restaurar Git (Frontend)
```bash
git log --oneline | grep broadcast
git revert [commit-hash]
```

## 🧹 Limpeza do Backup

Após confirmar que tudo está funcionando (aguarde alguns dias):

```sql
-- Remover o schema de backup:
DROP SCHEMA broadcast_backup CASCADE;
```

## ✅ Checklist Final

### Antes de Executar
- [ ] Ler completamente este guia
- [ ] Ter acesso ao Supabase Dashboard
- [ ] Fazer backup completo do banco (pg_dump)
- [ ] Avisar equipe sobre manutenção
- [ ] Executar em horário de baixo tráfego

### Durante Execução
- [ ] Executar backup_broadcast_data.sql
- [ ] Verificar estatísticas do backup
- [ ] Executar drop_broadcast_SAFE.sql
- [ ] Verificar mensagens de sucesso
- [ ] Executar list_broadcast_resources.sql
- [ ] Confirmar que não há recursos restantes

### Após Execução
- [ ] npm run build sem erros
- [ ] npm run dev funciona
- [ ] Página Automation carrega
- [ ] Outras páginas funcionam normalmente
- [ ] Git commit e push
- [ ] Monitorar logs por 24h

## 📞 Suporte

Se encontrar problemas:

1. **NÃO ENTRE EM PÂNICO** - O backup foi feito
2. Execute `ROLLBACK;` se ainda estiver na transação
3. Verifique os logs de erro
4. Consulte a seção de Rollback acima
5. Se necessário, restaure do backup do schema broadcast_backup

## 🎉 Benefícios Após Remoção

- ✅ Código mais limpo e focado
- ✅ Menor complexidade de manutenção
- ✅ Redução de ~4 tabelas no banco
- ✅ Redução de ~4 edge functions
- ✅ Menor carga no servidor
- ✅ Melhor performance geral

## 📊 Impacto Esperado

- **Dados removidos:** Todas as campanhas e históricos de broadcast
- **Funcionalidade alternativa:** Fluxos de Atendimento
- **Usuários afetados:** Usuários que usavam campanhas de broadcast
- **Tempo de inatividade:** 0 (operação em background)
- **Reversibilidade:** Alta (backup completo criado)

---

**Criado em:** 2025-10-12
**Autor:** Claude Code Agent
**Versão:** 1.0
