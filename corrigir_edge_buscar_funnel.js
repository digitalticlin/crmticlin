// ============================================
// CORREÇÃO DA EDGE: Buscar funnel_id da instância
// ============================================

// ARQUIVO: supabase/functions/webhook_whatsapp_web/index.ts
// LINHA: 449-453

// ❌ CÓDIGO ATUAL (linha 451):
/*
.select('id, created_by_user_id, instance_name')
*/

// ✅ CÓDIGO CORRIGIDO:
/*
.select('id, created_by_user_id, instance_name, funnel_id')
*/

// MUDANÇA COMPLETA NA CONSULTA:

const { data: instanceData, error: instanceError } = await supabase
  .from('whatsapp_instances')
  .select('id, created_by_user_id, instance_name, funnel_id')  // ← INCLUIR funnel_id
  .eq('instance_name', messageData.instanceId)
  .single();

// DEPOIS DA LINHA 465, ADICIONAR:

// 🎯 EXTRAIR FUNNEL_ID DA INSTÂNCIA (se tiver)
const instanceFunnelId = instanceData?.funnel_id || null;

console.log('[Webhook] 🎯 Funil da instância:', {
  instanceId: messageData.instanceId,
  funnelId: instanceFunnelId,
  hasInstanceFunnel: !!instanceFunnelId
});

// E NA LINHA 503, ALTERAR OS rpcParams para incluir:

const rpcParams = {
  p_vps_instance_id: messageData.instanceId,
  p_phone: cleanPhone,
  p_message_text: messageData.message.text || '',
  p_from_me: Boolean(messageData.fromMe),
  p_media_type: messageData.messageType || 'text',
  p_media_url: null,
  p_external_message_id: messageData.externalMessageId || null,
  p_contact_name: null,
  p_profile_pic_url: messageData.profile_pic_url || null,
  p_base64_data: messageData.mediaData?.base64Data || null,
  p_mime_type: messageData.mediaData?.mimeType || messageData.mediaData?.mimetype || getMimeType(messageData.messageType) || null,
  p_file_name: messageData.mediaData?.fileName || null,
  p_whatsapp_number_id: instanceData?.id || null,
  p_source_edge: 'webhook_whatsapp_web',
  p_instance_funnel_id: instanceFunnelId  // ← NOVO PARÂMETRO
};

// Esta mudança simples permite que a RPC saiba qual funil usar diretamente!