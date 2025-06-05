
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
  console.log('[QR Validation] 🔍 Buscando instância no banco...');
  
  const { data: instance, error: instanceError } = await supabase
    .from('whatsapp_instances')
    .select('vps_instance_id, company_id, qr_code, instance_name, connection_status, web_status')
    .eq('id', instanceId)
    .maybeSingle();

  if (instanceError) {
    console.error('[QR Validation] ❌ ERRO NO BANCO (instância):', instanceError);
    throw new Error(`Erro ao buscar instância: ${instanceError.message}`);
  }

  if (!instance) {
    console.error('[QR Validation] ❌ INSTÂNCIA NÃO ENCONTRADA:', instanceId);
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
