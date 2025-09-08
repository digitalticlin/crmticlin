# 📋 PLANO B: Filtro Manual (se RLS não funcionar)

## 🎯 Estratégia alternativa:

Se mesmo após a limpeza das policies o RLS não funcionar corretamente, implementar filtro manual nos hooks até o contexto de auth ser corrigido no Supabase.

## 🔧 Implementação:

### 1. Hook com filtro manual forçado:

```typescript
// src/hooks/salesFunnel/useLeadsDatabase.ts
const { data: leads = [], refetch: refetchLeads } = useQuery({
  queryKey: ["kanban-leads", funnelId],
  queryFn: async () => {
    if (!funnelId || !user?.id) return [];

    console.log('[useLeadsDatabase] 🔍 PLANO B: Filtro manual ativo');
    
    // 1. Buscar profile do admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("linked_auth_user_id", user.id)
      .single();

    if (!adminProfile) return [];

    // 2. Query com filtro FORÇADO (ignora RLS temporariamente)
    const { data, error } = await supabase
      .from("leads")
      .select(`*`)
      .eq("funnel_id", funnelId)
      .eq("created_by_user_id", adminProfile.id)  // FILTRO MANUAL OBRIGATÓRIO
      .order("order_position");

    if (error) throw error;
    
    console.log('[useLeadsDatabase] ✅ PLANO B: Filtrados', data?.length, 'leads');
    return data || [];
  },
  // ... resto do código
});
```

### 2. Middleware de segurança em todos os hooks:

```typescript
// src/utils/multitenantFilter.ts
export const ensureMultitenantFilter = async (user: any) => {
  if (!user?.id) throw new Error('User not authenticated');
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("linked_auth_user_id", user.id)
    .single();
    
  if (!profile) throw new Error('User profile not found');
  
  return profile.id;
};

// Usar em todos os hooks:
const profileId = await ensureMultitenantFilter(user);
```

## 🚨 Quando usar:

- Se após aplicar a migração `20250908210001_emergency_rls_cleanup.sql`
- E executar o teste `test_frontend_rls.js`
- O admin ainda vir mais de 500 leads
- Então implementar este Plano B

## 📈 Vantagens do Plano B:

- ✅ Garante isolamento multitenant 100%
- ✅ Funciona independente do RLS
- ✅ Performance controlada
- ✅ Logs claros para debug

## 🔄 Migração de volta para RLS:

Quando o contexto de auth for corrigido:
1. Remover filtros manuais dos hooks
2. Confiar novamente na RLS
3. Testar que apenas 456 leads aparecem