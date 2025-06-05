
import { corsHeaders } from './config.ts';

export async function validateQRCodeParams(instanceId: string, userId: string) {
  if (!instanceId || typeof instanceId !== 'string') {
    console.error('[QR Validation] ❌ ERRO CRÍTICO: instanceId inválido:', instanceId);
    throw new Error('Instance ID é obrigatório e deve ser uma string válida');
  }

  if (!userId || typeof userId !== 'string') {
    console.error('[QR Validation] ❌ ERRO CRÍTICO: userId inválido:', userId);
    throw new Error('User ID é obrigatório e deve ser uma string válida');
  }

  console.log('[QR Validation] ✅ Parâmetros validados com sucesso');
}

export async function validateInstanceAccess(supabase: any, instanceId: string, userId: string) {
  console.log('[QR Validation] 🔍 Buscando instância no banco (CORREÇÃO DEFINITIVA)...');
  console.log('[QR Validation] 📋 Instance ID recebido:', instanceId);
  
  // CORREÇÃO DEFINITIVA: Primeiro tentar buscar pelo ID do Supabase (formato UUID)
  let instance = null;
  let instanceError = null;

  // Verificar se é um UUID válido (Supabase ID)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(instanceId);
  
  if (isUUID) {
    console.log('[QR Validation] 🔍 Buscando por Supabase ID (UUID):', instanceId);
    
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, company_id, qr_code, instance_name, connection_status, web_status')
      .eq('id', instanceId)
      .maybeSingle();
    
    instance = data;
    instanceError = error;
  } else {
    console.log('[QR Validation] 🔍 Buscando por VPS Instance ID (string):', instanceId);
    
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, company_id, qr_code, instance_name, connection_status, web_status')
      .eq('vps_instance_id', instanceId)
      .maybeSingle();
    
    instance = data;
    instanceError = error;
  }

  if (instanceError) {
    console.error('[QR Validation] ❌ ERRO NO BANCO (instância):', instanceError);
    throw new Error(`Erro ao buscar instância: ${instanceError.message}`);
  }

  if (!instance) {
    console.error('[QR Validation] ❌ INSTÂNCIA NÃO ENCONTRADA:', instanceId);
    
    // CORREÇÃO: Tentar buscar todas as instâncias para debug
    const { data: allInstances, error: allError } = await supabase
      .from('whatsapp_instances')
      .select('id, vps_instance_id, instance_name, company_id')
      .limit(10);
    
    console.log('[QR Validation] 🔍 DEBUG - Instâncias no banco:', allInstances);
    console.log('[QR Validation] 🔍 DEBUG - Total instâncias:', allInstances?.length || 0);
    
    throw new Error('Instância não encontrada no banco de dados');
  }

  console.log('[QR Validation] ✅ Instância encontrada:', {
    id: instanceId,
    name: instance.instance_name,
    vpsInstanceId: instance.vps_instance_id,
    connectionStatus: instance.connection_status,
    webStatus: instance.web_status,
    hasQrCode: !!instance.qr_code
  });

  // Validar acesso do usuário
  console.log('[QR Validation] 🔐 Validando acesso do usuário...');
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error('[QR Validation] ❌ ERRO NO BANCO (profile):', profileError);
    throw new Error(`Erro ao buscar perfil do usuário: ${profileError.message}`);
  }

  if (!profile) {
    console.error('[QR Validation] ❌ PERFIL DO USUÁRIO NÃO ENCONTRADO:', userId);
    throw new Error('Perfil do usuário não encontrado');
  }

  if (profile.company_id !== instance.company_id) {
    console.error('[QR Validation] ❌ ACESSO NEGADO:', {
      userCompany: profile.company_id,
      instanceCompany: instance.company_id
    });
    throw new Error('Usuário não tem acesso a esta instância');
  }

  console.log('[QR Validation] ✅ Acesso validado com sucesso');
  
  return instance;
}
