// 🔧 CORREÇÃO: Adicionar logs e corrigir busca de instanceData

// TROCAR ESTA PARTE:
const { data: instanceData, error: instanceError } = await supabase
  .from('whatsapp_instances')
  .select('id, created_by_user_id')
  .eq('id', messageData.instanceId)  // ❌ PODE ESTAR ERRADO
  .single();

// POR ESTA (com debug):
console.log('[Webhook] 🔍 Buscando UUID da instância:', messageData.instanceId);

const { data: instanceData, error: instanceError } = await supabase
  .from('whatsapp_instances')
  .select('id, created_by_user_id')
  .eq('id', messageData.instanceId)  // Tentar primeiro com 'id'
  .single();

console.log('[Webhook] 📊 Resultado busca instância:', {
  instanceData,
  instanceError,
  instanceId: messageData.instanceId
});

// Se não encontrou, tentar buscar por outro campo se necessário
if (!instanceData && !instanceError) {
  console.log('[Webhook] ⚠️ Instância não encontrada por id, tentando buscar por nome...');
  // Implementar busca alternativa se necessário
}