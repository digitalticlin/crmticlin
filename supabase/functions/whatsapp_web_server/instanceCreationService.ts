
import { VPS_CONFIG, corsHeaders, testVPSConnection, isRealQRCode } from './config.ts';
import { InstanceData } from './types.ts';
import { createVPSInstance } from './vpsRequestService.ts';
import { waitForQRCode, updateQRCodeInDatabase } from './qrCodePollingService.ts';
import { 
  validateInstanceCreationParams, 
  getUserCompany, 
  validateInstanceNameUniqueness, 
  cleanupOrphanedInstances 
} from './instanceValidationService.ts';

export async function createWhatsAppInstance(supabase: any, instanceData: InstanceData, userId: string) {
  console.log('[Instance Creation] 🚀 INICIANDO criação WhatsApp Web.js instance (CORREÇÃO FINAL):', instanceData);
  console.log(`[Instance Creation] 👤 User ID recebido: ${userId}`);

  try {
    // PASSO 1: Validar parâmetros de entrada
    await validateInstanceCreationParams(instanceData, userId);

    // PASSO 2: Testar conectividade VPS
    console.log('[Instance Creation] 🔧 PASSO 1: Testando conectividade VPS...');
    const vpsTest = await testVPSConnection();
    
    if (!vpsTest.success) {
      console.error('[Instance Creation] ❌ VPS não acessível:', vpsTest.error);
      throw new Error(`VPS inacessível: ${vpsTest.error}`);
    }
    
    console.log('[Instance Creation] ✅ VPS acessível - prosseguindo...');

    // PASSO 3: Obter dados da empresa do usuário
    const profile = await getUserCompany(supabase, userId);

    // PASSO 4: Limpar instâncias órfãs e validar unicidade
    await cleanupOrphanedInstances(supabase, profile.company_id, instanceData.instanceName);
    await validateInstanceNameUniqueness(supabase, profile.company_id, instanceData.instanceName);

    // PASSO 5: Gerar ID único para VPS
    const vpsInstanceId = `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // PASSO 6: Criar instância na VPS
    console.log('[Instance Creation] 🔧 Criando instância na VPS...');
    const payload = {
      instanceId: vpsInstanceId,
      instanceName: instanceData.instanceName,
      sessionName: instanceData.instanceName,
      webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp_web_server`,
      companyId: profile.company_id
    };

    const vpsResult = await createVPSInstance(payload);
    console.log('[Instance Creation] ✅ Instância criada na VPS - Resultado:', vpsResult);

    // PASSO 7: Salvar no banco IMEDIATAMENTE
    console.log('[Instance Creation] 💾 Salvando no banco IMEDIATAMENTE...');
    
    const instanceToSave = {
      instance_name: instanceData.instanceName,
      phone: '',
      company_id: profile.company_id,
      connection_type: 'web',
      server_url: VPS_CONFIG.baseUrl,
      vps_instance_id: vpsInstanceId,
      web_status: 'waiting_scan',
      connection_status: 'connecting',
      qr_code: vpsResult.qrCode || null
    };

    console.log('[Instance Creation] 📋 Dados para salvar:', instanceToSave);

    const { data: dbInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceToSave)
      .select()
      .single();

    if (dbError) {
      console.error('[Instance Creation] ❌ ERRO CRÍTICO - Database error after VPS success:', dbError);
      console.error('[Instance Creation] 📋 Dados que causaram erro:', instanceToSave);
      throw new Error(`Erro CRÍTICO no banco de dados: ${dbError.message}`);
    }

    console.log('[Instance Creation] 🎉 INSTÂNCIA SALVA COM SUCESSO no banco:', dbInstance);

    // PASSO 8: Tentar obter QR Code real se não veio inicialmente
    let finalQRCode = vpsResult.qrCode;
    
    if (!finalQRCode || !isRealQRCode(finalQRCode)) {
      console.log('[Instance Creation] 🔄 QR Code não disponível - iniciando polling...');
      
      const polledQRCode = await waitForQRCode(vpsInstanceId);
      
      if (polledQRCode) {
        const updated = await updateQRCodeInDatabase(supabase, dbInstance.id, polledQRCode);
        if (updated) {
          finalQRCode = polledQRCode;
          console.log('[Instance Creation] 🎉 QR Code obtido via polling e atualizado no banco!');
        }
      }
    }

    console.log('[Instance Creation] 🎉 SUCESSO TOTAL! Instance ID:', dbInstance.id);

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          ...dbInstance,
          qr_code: finalQRCode
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Instance Creation] 💥 ERRO GERAL:', error);
    console.error('[Instance Creation] Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        action: 'error_handling_improved',
        timestamp: new Date().toISOString(),
        details: {
          step: 'creation_process',
          userId: userId,
          instanceName: instanceData?.instanceName
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
