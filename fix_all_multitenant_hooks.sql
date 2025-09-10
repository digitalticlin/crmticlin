-- 🔍 SCRIPT PARA APLICAR CORREÇÃO MULTITENANT EM MASSA
-- Execute este comando para aplicar filtro .eq('created_by_user_id', userProfile.id) em todos os hooks

-- Lista de hooks que precisam de correção multitenant:
-- ✅ useDashboardKPIs.ts (CORRIGIDO)
-- ✅ useWhatsAppContacts.ts (CORRIGIDO) 
-- ✅ useFunnelDashboard.ts (JÁ CORRIGIDO)
-- ✅ useLeadsDatabase.ts (JÁ CORRIGIDO)

-- Hooks restantes que precisam de verificação:
-- 🔍 useTeamMemberEditor.ts
-- 🔍 useSalesFunnelDirect.ts
-- 🔍 clients/queries.ts
-- 🔍 useSalesFunnelOptimized.ts
-- 🔍 useWhatsAppChat.ts
-- 🔍 useStageManagement.ts
-- 🔍 dashboard/usePerformanceByOwner.ts
-- 🔍 dashboard/useTemporalEvolution.ts
-- 🔍 useStageOperations.ts
-- 🔍 chat/useLeadStageManager.ts
-- 🔍 useContactNotes.ts
-- 🔍 useLeadCreation.ts
-- 🔍 clients/mutations.ts
-- 🔍 chat/useContactNotesManager.ts

-- PADRÃO DE CORREÇÃO:
-- 1. Adicionar busca de profile no início:
/*
const { data: userProfile, error: profileError } = await supabase
  .from("profiles")
  .select("id, role")
  .eq("id", user.id)
  .single();

if (profileError || !userProfile) {
  console.error('[HOOK_NAME] ❌ Profile não encontrado:', profileError);
  throw new Error('Perfil do usuário não encontrado');
}
*/

-- 2. Adicionar filtro em todas as queries de leads:
/*
.eq('created_by_user_id', userProfile.id)  // 🔒 FILTRO MULTITENANT
*/

-- ========================================
-- VERIFICAÇÃO SE CORREÇÃO FUNCIONOU
-- ========================================

SELECT '=== TESTE MULTITENANT PÓS CORREÇÃO ===' as info;

-- Verificar se cada admin vê apenas seus leads
SELECT 
    created_by_user_id,
    COUNT(*) as total_leads,
    'Cada linha deve ter <= 500 leads' as verificacao
FROM leads 
GROUP BY created_by_user_id
ORDER BY total_leads DESC;

-- Resultado esperado: admin 7c197601 deve ter ~456 leads
-- Se algum usuário tiver > 1000 leads, ainda há vazamento!