-- 🔧 CORREÇÃO: Webhook Progress com UPSERT
-- Problema: Webhook tenta atualizar sessão que não existe ainda
-- Solução: Usar UPSERT (inserir se não existir, atualizar se existir)

-- Vamos modificar a Edge Function para fazer UPSERT ao invés de UPDATE puro

/*
MUDANÇA NECESSÁRIA na handleWebhookProgress:

ANTES (linha 170):
const { data: updatedSession, error: updateError } = await supabase
  .from('instances_puppeteer')
  .update(updateData)
  .eq('session_id', sessionId)
  .select()
  .single();

DEPOIS:
const { data: updatedSession, error: updateError } = await supabase
  .from('instances_puppeteer')
  .upsert({
    session_id: sessionId,
    instance_id: sessionId.split('_')[1], // Extrair instanceId do sessionId
    user_id: null, // Será preenchido depois
    ...updateData
  })
  .select()
  .single();
*/

-- Esta correção resolve o problema porque:
-- 1. Se a sessão não existir, será criada automaticamente
-- 2. Se existir, será atualizada normalmente  
-- 3. O QR Code será salvo corretamente 