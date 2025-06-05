
import { VPS_CONFIG, corsHeaders, getVPSHeaders, isRealQRCode, testVPSConnection } from './config.ts';
import { InstanceData } from './types.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[VPS Request] Attempt ${i + 1}/${retries} to: ${url}`);
      console.log(`[VPS Request] Headers:`, options.headers);
      console.log(`[VPS Request] Body:`, options.body);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(45000), // 45 second timeout
      });
      
      console.log(`[VPS Response] Status: ${response.status} ${response.statusText}`);
      console.log(`[VPS Response] Headers:`, Object.fromEntries(response.headers.entries()));
      
      return response;
    } catch (error) {
      console.error(`[VPS Request] Error (attempt ${i + 1}):`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// CORREÇÃO PERMANENTE: Função para aguardar QR Code ser gerado
async function waitForQRCode(vpsInstanceId: string, maxAttempts = 6, delayMs = 5000): Promise<string | null> {
  console.log(`[QR Polling] 🔄 Iniciando polling para QR Code: ${vpsInstanceId}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[QR Polling] Tentativa ${attempt}/${maxAttempts} para obter QR Code`);
      
      const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
        method: 'POST',
        headers: getVPSHeaders(),
        body: JSON.stringify({ instanceId: vpsInstanceId })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.qrCode && isRealQRCode(data.qrCode)) {
          console.log(`[QR Polling] ✅ QR Code REAL obtido na tentativa ${attempt}`);
          return data.qrCode;
        } else {
          console.log(`[QR Polling] ⏳ QR Code ainda não disponível (tentativa ${attempt})`);
        }
      } else {
        console.log(`[QR Polling] ⚠️ Erro na tentativa ${attempt}: ${response.status}`);
      }
      
      // Aguardar antes da próxima tentativa (exceto na última)
      if (attempt < maxAttempts) {
        console.log(`[QR Polling] 😴 Aguardando ${delayMs}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
    } catch (error) {
      console.error(`[QR Polling] ❌ Erro na tentativa ${attempt}:`, error);
    }
  }
  
  console.log(`[QR Polling] ⏰ Timeout após ${maxAttempts} tentativas - QR Code será obtido posteriormente`);
  return null;
}

export async function createWhatsAppInstance(supabase: any, instanceData: InstanceData, userId: string) {
  console.log('[Instance Management] 🚀 INICIANDO criação WhatsApp Web.js instance (CORREÇÃO PERMANENTE):', instanceData);
  console.log(`[Instance Management] 👤 User ID recebido: ${userId}`);

  try {
    // CORREÇÃO: Validar parâmetros de entrada
    if (!userId || typeof userId !== 'string') {
      console.error('[Instance Management] ❌ User ID inválido:', userId);
      throw new Error('User ID is required and must be a valid string');
    }

    if (!instanceData?.instanceName) {
      console.error('[Instance Management] ❌ Instance name inválido:', instanceData);
      throw new Error('Instance name is required');
    }

    // PASSO 1: Testar conectividade VPS ANTES de qualquer coisa
    console.log('[Instance Management] 🔧 PASSO 1: Testando conectividade VPS...');
    const vpsTest = await testVPSConnection();
    
    if (!vpsTest.success) {
      console.error('[Instance Management] ❌ VPS não acessível:', vpsTest.error);
      throw new Error(`VPS inacessível: ${vpsTest.error}`);
    }
    
    console.log('[Instance Management] ✅ VPS acessível - prosseguindo...');

    // PASSO 2: Obter dados da empresa do usuário
    console.log(`[Instance Management] 🏢 PASSO 2: Buscando company_id para usuário: ${userId}`);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[Instance Management] ❌ Erro ao buscar profile:', profileError);
      throw new Error(`Profile not found for user: ${profileError.message}`);
    }

    if (!profile?.company_id) {
      console.error('[Instance Management] ❌ Company ID não encontrado para usuário:', userId);
      throw new Error('User company not found');
    }

    console.log(`[Instance Management] ✅ Company ID encontrado: ${profile.company_id}`);

    // Generate unique VPS instance ID
    const vpsInstanceId = `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // PASSO 3: Check for orphaned instances and clean them up
    console.log('[Instance Management] 🧹 PASSO 3: Limpando instâncias órfãs...');
    const { data: orphanedInstances } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name, vps_instance_id')
      .eq('company_id', profile.company_id)
      .eq('instance_name', instanceData.instanceName);

    if (orphanedInstances && orphanedInstances.length > 0) {
      console.log(`[Instance Management] Found ${orphanedInstances.length} potential orphaned instances with same name`);
      
      // Delete orphaned instances (those without proper VPS connection)
      for (const orphan of orphanedInstances) {
        if (!orphan.vps_instance_id || orphan.vps_instance_id === '') {
          console.log(`[Instance Management] 🗑️ Cleaning up orphaned instance: ${orphan.id}`);
          await supabase
            .from('whatsapp_instances')
            .delete()
            .eq('id', orphan.id);
        }
      }
    }

    // PASSO 4: Validate instance name uniqueness
    console.log('[Instance Management] 🔍 PASSO 4: Validando unicidade do nome...');
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('company_id', profile.company_id)
      .eq('instance_name', instanceData.instanceName)
      .maybeSingle();

    if (existingInstance) {
      throw new Error(`Instância com nome "${instanceData.instanceName}" já existe. Tente com outro nome.`);
    }

    // PASSO 5: Create instance na VPS (CORREÇÃO PERMANENTE)
    console.log('[Instance Management] 🔧 PASSO 5: Criando instância na VPS (CORREÇÃO PERMANENTE)...');
    let vpsResult;
    try {
      // Payload structure CORRIGIDO
      const payload = {
        instanceId: vpsInstanceId,
        instanceName: instanceData.instanceName,
        sessionName: instanceData.instanceName,
        webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`,
        companyId: profile.company_id
      };
      
      console.log('[Instance Management] 📤 Payload:', JSON.stringify(payload, null, 2));
      console.log('[Instance Management] 🔑 Headers:', getVPSHeaders());
      
      const correctEndpoint = `${VPS_CONFIG.baseUrl}/instance/create`;
      console.log('[Instance Management] 🎯 URL (CORREÇÃO PERMANENTE):', correctEndpoint);
      
      const vpsResponse = await makeVPSRequest(correctEndpoint, {
        method: 'POST',
        headers: getVPSHeaders(),
        body: JSON.stringify(payload)
      });

      const responseText = await vpsResponse.text();
      console.log('[Instance Management] 📥 VPS Raw Response:', responseText);

      if (vpsResponse.ok) {
        try {
          vpsResult = JSON.parse(responseText);
          console.log('[Instance Management] ✅ VPS creation response (CORREÇÃO PERMANENTE):', vpsResult);
        } catch (parseError) {
          console.error('[Instance Management] ❌ Erro ao fazer parse da resposta VPS:', parseError);
          throw new Error(`VPS retornou resposta inválida: ${responseText}`);
        }
        
        // CORREÇÃO CRÍTICA: Não falhar se QR Code é null inicialmente
        if (!vpsResult.success) {
          throw new Error(`VPS retornou falha: ${vpsResult.error || 'Erro desconhecido'}`);
        }
        
        console.log('[Instance Management] ✅ Instância criada na VPS (CORREÇÃO PERMANENTE) - QR Code será obtido posteriormente se necessário');
        
      } else {
        console.error(`[Instance Management] ❌ VPS creation failed with status ${vpsResponse.status}: ${responseText}`);
        throw new Error(`VPS creation failed: ${vpsResponse.status} - ${responseText}`);
      }
    } catch (vpsError) {
      console.error('[Instance Management] 💥 VPS creation error:', vpsError);
      throw new Error(`Erro na criação VPS: ${vpsError.message}`);
    }

    // PASSO 6: Salvar no banco SEMPRE após sucesso da VPS
    console.log('[Instance Management] 💾 PASSO 6: Salvando no banco...');
    let finalQRCode = vpsResult.qrCode;
    
    try {
      const { data: dbInstance, error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_name: instanceData.instanceName,
          phone: '', // Will be updated when connected
          company_id: profile.company_id,
          connection_type: 'web',
          server_url: VPS_CONFIG.baseUrl,
          vps_instance_id: vpsInstanceId,
          web_status: 'waiting_scan', // Status correto independente do QR Code
          connection_status: 'connecting',
          qr_code: finalQRCode // Pode ser null inicialmente
        })
        .select()
        .single();

      if (dbError) {
        console.error('[Instance Management] ❌ Database error after VPS success:', dbError);
        
        // Se banco falha, tentar limpar VPS usando endpoint correto
        try {
          await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/delete`, {
            method: 'POST',
            headers: getVPSHeaders(),
            body: JSON.stringify({ instanceId: vpsInstanceId })
          });
        } catch (cleanupError) {
          console.error('[Instance Management] ❌ Failed to cleanup VPS instance after DB error:', cleanupError);
        }
        
        throw new Error(`Erro no banco de dados: ${dbError.message}`);
      }

      // PASSO 7: CORREÇÃO PERMANENTE - Tentar obter QR Code real se não veio inicialmente
      if (!finalQRCode || !isRealQRCode(finalQRCode)) {
        console.log('[Instance Management] 🔄 PASSO 7: QR Code não disponível - iniciando polling...');
        
        // Executar polling para QR Code em background sem bloquear a resposta
        const polledQRCode = await waitForQRCode(vpsInstanceId);
        
        if (polledQRCode) {
          // Atualizar QR Code no banco
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({ qr_code: polledQRCode })
            .eq('id', dbInstance.id);
            
          if (!updateError) {
            finalQRCode = polledQRCode;
            console.log('[Instance Management] 🎉 QR Code obtido via polling e atualizado no banco!');
          }
        }
      }

      console.log('[Instance Management] 🎉 SUCESSO TOTAL (CORREÇÃO PERMANENTE)! Instance ID:', dbInstance.id);

      return new Response(
        JSON.stringify({
          success: true,
          instance: {
            ...dbInstance,
            qr_code: finalQRCode // QR code final (pode ser null se ainda não estiver pronto)
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('[Instance Management] 💥 Unexpected error during database operation (CORREÇÃO PERMANENTE):', error);
      throw error;
    }

  } catch (error: any) {
    console.error('[Instance Management] 💥 ERRO GERAL (CORREÇÃO PERMANENTE):', error);
    console.error('[Instance Management] Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        action: 'error_handling_improved',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function deleteWhatsAppInstance(supabase: any, instanceId: string) {
  console.log('[Instance Management] Deleting WhatsApp Web.js instance (CORREÇÃO PERMANENTE):', instanceId);

  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('vps_instance_id, instance_name')
    .eq('id', instanceId)
    .single();

  if (!instance?.vps_instance_id) {
    console.log('[Instance Management] No VPS instance ID found, only deleting from database');
  } else {
    // Use CORRECT delete endpoint with proper headers
    try {
      console.log('[Instance Management] Deleting from VPS with corrected authentication');
      
      await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/delete`, {
        method: 'POST',
        headers: getVPSHeaders(),
        body: JSON.stringify({ 
          instanceId: instance.vps_instance_id,
          instanceName: instance.instance_name 
        })
      });
      
      console.log('[Instance Management] Successfully deleted from VPS');
    } catch (deleteError) {
      console.error('[Instance Management] VPS delete error:', deleteError);
      // Continue with database deletion even if VPS delete fails
    }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('whatsapp_instances')
    .delete()
    .eq('id', instanceId);

  if (deleteError) {
    throw new Error(`Database delete error: ${deleteError.message}`);
  }

  console.log('[Instance Management] Instance successfully deleted from database');

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
