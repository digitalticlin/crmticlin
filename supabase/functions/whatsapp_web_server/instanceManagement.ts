
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
        signal: AbortSignal.timeout(45000), // 45 second timeout para aguardar QR real
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

export async function createWhatsAppInstance(supabase: any, instanceData: InstanceData, userId: string) {
  console.log('[Instance Management] 🚀 INICIANDO criação WhatsApp Web.js instance:', instanceData);

  // PASSO 1: Testar conectividade VPS ANTES de qualquer coisa
  console.log('[Instance Management] 🔧 PASSO 1: Testando conectividade VPS...');
  const vpsTest = await testVPSConnection();
  
  if (!vpsTest.success) {
    console.error('[Instance Management] ❌ VPS não acessível:', vpsTest.error);
    throw new Error(`VPS inacessível: ${vpsTest.error}`);
  }
  
  console.log('[Instance Management] ✅ VPS acessível - prosseguindo...');

  // Get user company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single();

  if (!profile?.company_id) {
    throw new Error('User company not found');
  }

  // Generate unique VPS instance ID
  const vpsInstanceId = `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // PASSO 2: Check for orphaned instances and clean them up
  console.log('[Instance Management] 🧹 PASSO 2: Limpando instâncias órfãs...');
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

  // PASSO 3: Validate instance name uniqueness
  console.log('[Instance Management] 🔍 PASSO 3: Validando unicidade do nome...');
  const { data: existingInstance } = await supabase
    .from('whatsapp_instances')
    .select('id')
    .eq('company_id', profile.company_id)
    .eq('instance_name', instanceData.instanceName)
    .maybeSingle();

  if (existingInstance) {
    throw new Error(`Instância com nome "${instanceData.instanceName}" já existe. Tente com outro nome.`);
  }

  // PASSO 4: Create instance na VPS com CORREÇÃO de autenticação
  console.log('[Instance Management] 🔧 PASSO 4: Criando instância na VPS...');
  let vpsResult;
  try {
    // Payload structure CORRIGIDO
    const payload = {
      instanceId: vpsInstanceId,
      sessionName: instanceData.instanceName,
      webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`,
      companyId: profile.company_id
    };
    
    console.log('[Instance Management] 📤 Payload:', JSON.stringify(payload, null, 2));
    console.log('[Instance Management] 🔑 Headers:', getVPSHeaders());
    console.log('[Instance Management] 🎯 URL:', `${VPS_CONFIG.baseUrl}/instance/create`);
    
    const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/create`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify(payload)
    });

    const responseText = await vpsResponse.text();
    console.log('[Instance Management] 📥 VPS Raw Response:', responseText);

    if (vpsResponse.ok) {
      try {
        vpsResult = JSON.parse(responseText);
        console.log('[Instance Management] ✅ VPS creation response:', vpsResult);
      } catch (parseError) {
        console.error('[Instance Management] ❌ Erro ao fazer parse da resposta VPS:', parseError);
        throw new Error(`VPS retornou resposta inválida: ${responseText}`);
      }
      
      // VALIDAÇÃO CRÍTICA: Verificar se VPS realmente retornou sucesso E QR code real
      if (!vpsResult.success) {
        throw new Error(`VPS retornou falha: ${vpsResult.error || 'Erro desconhecido'}`);
      }
      
      // Verificar se tem QR code
      if (!vpsResult.qrCode) {
        throw new Error('VPS não retornou QR Code. Instância pode não ter sido criada corretamente.');
      }
      
      // Validar se QR code é real
      const qrIsReal = isRealQRCode(vpsResult.qrCode);
      console.log(`[Instance Management] 🔍 QR Code validation - Is Real: ${qrIsReal}`);
      
      if (!qrIsReal) {
        console.error('[Instance Management] ❌ VPS returned fake QR code - FALHA CRÍTICA');
        throw new Error('VPS retornou QR Code falso. WhatsApp Web.js não foi inicializado corretamente. Tente novamente.');
      }
      
      console.log('[Instance Management] ✅ VPS retornou QR CODE REAL - prosseguindo...');
      
    } else {
      console.error(`[Instance Management] ❌ VPS creation failed with status ${vpsResponse.status}: ${responseText}`);
      throw new Error(`VPS creation failed: ${vpsResponse.status} - ${responseText}`);
    }
  } catch (vpsError) {
    console.error('[Instance Management] 💥 VPS creation error:', vpsError);
    throw new Error(`Erro na criação VPS: ${vpsError.message}`);
  }

  // PASSO 5: Salvar no banco APENAS após sucesso da VPS
  console.log('[Instance Management] 💾 PASSO 5: Salvando no banco...');
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
        web_status: 'waiting_scan', // QR real disponível para scan
        connection_status: 'connecting',
        qr_code: vpsResult.qrCode // QR code REAL do VPS
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Instance Management] ❌ Database error after VPS success:', dbError);
      
      // Se banco falha, tentar limpar VPS
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

    console.log('[Instance Management] 🎉 SUCESSO TOTAL! Instance ID:', dbInstance.id);

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          ...dbInstance,
          qr_code: vpsResult.qrCode // QR code REAL confirmado
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Instance Management] 💥 Unexpected error during database operation:', error);
    throw error;
  }
}

export async function deleteWhatsAppInstance(supabase: any, instanceId: string) {
  console.log('[Instance Management] Deleting WhatsApp Web.js instance:', instanceId);

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
