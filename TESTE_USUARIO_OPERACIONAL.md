# 🧪 TESTE DO SISTEMA DE PERMISSÕES OPERACIONAIS

## ✅ Status: PRONTO PARA TESTE

O sistema de filtros de permissões foi corrigido e está funcionando. Agora você pode testar com usuário operacional.

## 📋 INSTRUÇÕES DE TESTE

### 1. 🚀 Servidor de Desenvolvimento
O servidor está rodando em: **http://localhost:8081**

### 2. 📊 Preparar Dados de Teste
Execute no painel do Supabase:

```sql
-- Execute o arquivo: debug_operational_access.sql
-- Para verificar dados atuais

-- Execute o arquivo: setup_test_operational_user.sql  
-- Para criar dados de teste (substitua o email pelo usuário real)
```

### 3. 🔐 Acessar Como Usuário Operacional

1. **Acesse**: http://localhost:8081/login
2. **Faça login** com uma conta que tenha `role = 'operational'`
3. **Navegue para**: http://localhost:8081/test-operational

### 4. 🧪 Página de Teste

A página `/test-operational` mostra:

- ✅ **Informações da Sessão**: User ID, email, role detectada
- ✅ **Filtros Aplicados**: JSON dos filtros baseados na role
- ✅ **Funis Acessíveis**: Apenas funis da tabela `user_funnels`
- ✅ **Leads Acessíveis**: Apenas leads com `owner_id = seu_user_id`
- ✅ **Status dos Testes**: Indicadores visuais de funcionamento

### 5. 🔍 O Que Esperar (Usuário Operacional)

**✅ FUNCIONANDO:**
- Role detectada: `operacional`
- Filtros configurados (não mais `no-access`)
- Funis: Apenas os atribuídos via `user_funnels`
- Leads: Apenas os com `owner_id` igual ao seu ID
- WhatsApp: Apenas instâncias de `user_whatsapp_numbers`

**❌ PROBLEMAS ANTIGOS CORRIGIDOS:**
- ~~Filtros mostrando `{ "id": "no-access" }`~~ ✅ RESOLVIDO
- ~~Query buscando colunas inexistentes~~ ✅ RESOLVIDO
- ~~Schema incompatível~~ ✅ RESOLVIDO

### 6. 📱 Testar Páginas Reais (Próximo Passo)

Após confirmar que a página de teste funciona:

1. **Dashboard**: `/dashboard`
2. **Funis**: `/funnels` 
3. **Leads**: `/leads`
4. **WhatsApp**: `/whatsapp-chat`

### 7. 🔧 Debug Console

Abra o console do navegador (F12) para ver logs detalhados:

```
[useDataFilters] 🔍 Configurando filtros para role: operational
[useDataFilters] 🎯 Buscando atribuições operacionais para: [USER_ID]
[useDataFilters] 📊 user_funnels encontrados: [...]
[useDataFilters] 📱 user_whatsapp_numbers encontrados: [...]
[useDataFilters] 🎯 Filtros OPERACIONAL configurados: {...}
```

## 📁 Arquivos Modificados

- ✅ `src/hooks/useDataFilters.ts` - Filtros corrigidos
- ✅ `src/pages/TestOperationalData.tsx` - Página de teste
- ✅ `debug_operational_access.sql` - Verificar dados
- ✅ `setup_test_operational_user.sql` - Criar dados de teste

## 🎯 Próximos Passos

1. **Teste a página**: http://localhost:8081/test-operational
2. **Confirme que os filtros funcionam**
3. **Reporte o resultado**
4. **Se OK**: Aplicaremos os filtros às páginas reais
5. **Se problema**: Debugaremos juntos

---

**🔍 LEMBRE-SE**: Acesse com usuário que tem `role = 'operational'` na tabela `profiles` e que tenha dados nas tabelas `user_funnels` e `user_whatsapp_numbers`.