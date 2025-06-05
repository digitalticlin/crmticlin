
import { VPS_CONFIG, getVPSHeaders, isRealQRCode, corsHeaders } from './config.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[QR Async VPS] 🔄 Tentativa ${i + 1}/${retries} para: ${url}`);
      console.log(`[QR Async VPS] 📤 Headers:`, options.headers);
      console.log(`[QR Async VPS] 📤 Body:`, options.body);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(20000), // 20 segundos timeout
      });
      
      console.log(`[QR Async VPS] 📥 Status: ${response.status} ${response.statusText}`);
      console.log(`[QR Async VPS] 📥 Headers:`, Object.fromEntries(response.headers.entries()));
      
      return response;
    } catch (error) {
      console.error(`[QR Async VPS] ❌ Erro (tentativa ${i + 1}):`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      const delay = Math.pow(2, i) * 1000;
      console.log(`[QR Async VPS] ⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function getQRCodeAsync(supabase: any, instanceId: string, userId: string) {
  console.log(`[QR Async] 📱 INICIANDO obtenção QR Code ROBUSTA para instância: ${instanceId}`);
  console.log(`[QR Async] 👤 Usuário: ${userId}`);
  
  try {
    // PASSO 1: VALIDAÇÃO ROBUSTA DE PARÂMETROS
    if (!instanceId || typeof instanceId !== 'string') {
      console.error('[QR Async] ❌ ERRO CRÍTICO: instanceId inválido:', instanceId);
      throw new Error('Instance ID é obrigatório e deve ser uma string válida');
    }

    if (!userId || typeof userId !== 'string') {
      console.error('[QR Async] ❌ ERRO CRÍTICO: userId inválido:', userId);
      throw new Error('User ID é obrigatório e deve ser uma string válida');
    }

    console.log(`[QR Async] ✅ PASSO 1: Parâmetros validados com sucesso`);

    // PASSO 2: BUSCAR INSTÂNCIA NO BANCO COM VALIDAÇÃO ROBUSTA
    console.log(`[QR Async] 🔍 PASSO 2: Buscando instância no banco...`);
    
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, company_id, qr_code, instance_name, connection_status, web_status')
      .eq('id', instanceId)
      .maybeSingle(); // Usar maybeSingle para evitar erro se não encontrar

    if (instanceError) {
      console.error('[QR Async] ❌ ERRO NO BANCO (instância):', instanceError);
      throw new Error(`Erro ao buscar instância: ${instanceError.message}`);
    }

    if (!instance) {
      console.error('[QR Async] ❌ INSTÂNCIA NÃO ENCONTRADA:', instanceId);
      throw new Error('Instância não encontrada no banco de dados');
    }

    console.log(`[QR Async] ✅ Instância encontrada:`, {
      id: instanceId,
      name: instance.instance_name,
      vpsInstanceId: instance.vps_instance_id,
      connectionStatus: instance.connection_status,
      webStatus: instance.web_status,
      hasQrCode: !!instance.qr_code
    });

    // PASSO 3: VALIDAR ACESSO DO USUÁRIO
    console.log(`[QR Async] 🔐 PASSO 3: Validando acesso do usuário...`);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('[QR Async] ❌ ERRO NO BANCO (profile):', profileError);
      throw new Error(`Erro ao buscar perfil do usuário: ${profileError.message}`);
    }

    if (!profile) {
      console.error('[QR Async] ❌ PERFIL DO USUÁRIO NÃO ENCONTRADO:', userId);
      throw new Error('Perfil do usuário não encontrado');
    }

    if (profile.company_id !== instance.company_id) {
      console.error('[QR Async] ❌ ACESSO NEGADO:', {
        userCompany: profile.company_id,
        instanceCompany: instance.company_id
      });
      throw new Error('Usuário não tem acesso a esta instância');
    }

    console.log(`[QR Async] ✅ PASSO 3: Acesso validado com sucesso`);

    // PASSO 4: VERIFICAR QR CODE EXISTENTE (CACHE)
    console.log(`[QR Async] 📋 PASSO 4: Verificando QR Code existente...`);
    
    if (instance.qr_code && isRealQRCode(instance.qr_code)) {
      console.log('[QR Async] ✅ QR Code já disponível no banco (CACHE HIT)');
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: instance.qr_code,
          cached: true,
          instanceName: instance.instance_name,
          message: 'QR Code obtido do cache'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[QR Async] ⚠️ QR Code não disponível no cache, buscando na VPS...`);

    // PASSO 5: VALIDAR VPS INSTANCE ID
    if (!instance.vps_instance_id) {
      console.error('[QR Async] ❌ VPS Instance ID não encontrado para:', instanceId);
      throw new Error('VPS Instance ID não configurado para esta instância');
    }

    console.log(`[QR Async] ✅ VPS Instance ID válido: ${instance.vps_instance_id}`);

    // PASSO 6: BUSCAR QR CODE NA VPS COM RETRY ROBUSTO
    console.log('[QR Async] 🔄 PASSO 6: Buscando QR Code na VPS...');
    
    let vpsResponse;
    let vpsData;
    
    try {
      vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
        method: 'POST',
        headers: getVPSHeaders(),
        body: JSON.stringify({ instanceId: instance.vps_instance_id })
      });

      if (!vpsResponse.ok) {
        const errorText = await vpsResponse.text();
        console.error(`[QR Async] ❌ VPS retornou erro: ${vpsResponse.status} - ${errorText}`);
        
        // Análise específica do erro da VPS
        let errorMessage = `VPS retornou status ${vpsResponse.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          
          // Se o erro indica que QR Code ainda não está pronto, não é erro crítico
          if (errorText.includes('ainda não foi gerado') || 
              errorText.includes('inicializando') ||
              errorText.includes('waiting_scan')) {
            console.log('[QR Async] ⏳ QR Code ainda sendo gerado pela VPS (normal)');
            return new Response(
              JSON.stringify({
                success: false,
                error: 'QR Code ainda não disponível - WhatsApp Web.js ainda está inicializando',
                waiting: true,
                instanceName: instance.instance_name,
                retryAfter: 10000, // Sugerir retry em 10 segundos
                message: 'Instância ainda está se conectando. Tente novamente em alguns segundos.'
              }),
              { 
                status: 202, // Accepted - processing
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        } catch (parseError) {
          console.error('[QR Async] ❌ Erro ao fazer parse do erro da VPS:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await vpsResponse.text();
      console.log('[QR Async] 📥 VPS Raw Response:', responseText);
      
      try {
        vpsData = JSON.parse(responseText);
        console.log('[QR Async] 📋 VPS Parsed Data:', vpsData);
      } catch (parseError) {
        console.error('[QR Async] ❌ Erro ao fazer parse da resposta VPS:', parseError);
        throw new Error(`VPS retornou resposta inválida: ${responseText}`);
      }

    } catch (fetchError) {
      console.error('[QR Async] ❌ Erro na requisição VPS:', fetchError);
      throw new Error(`Erro na comunicação com VPS: ${fetchError.message}`);
    }

    // PASSO 7: VALIDAR E PROCESSAR RESPOSTA DA VPS
    console.log('[QR Async] ✅ PASSO 7: Processando resposta da VPS...');
    
    if (vpsData.qrCode && isRealQRCode(vpsData.qrCode)) {
      console.log('[QR Async] 🎉 QR Code REAL obtido da VPS - atualizando banco');
      
      // PASSO 8: ATUALIZAR QR CODE NO BANCO
      try {
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({ 
            qr_code: vpsData.qrCode,
            web_status: vpsData.status || 'waiting_scan',
            updated_at: new Date().toISOString()
          })
          .eq('id', instanceId);

        if (updateError) {
          console.error('[QR Async] ⚠️ Erro ao atualizar QR Code no banco:', updateError);
          // Não falhar por causa disso, QR Code foi obtido com sucesso
        } else {
          console.log('[QR Async] ✅ QR Code atualizado no banco com sucesso');
        }
      } catch (updateError) {
        console.error('[QR Async] ⚠️ Erro na atualização do banco:', updateError);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: vpsData.qrCode,
          cached: false,
          instanceName: instance.instance_name,
          status: vpsData.status || 'waiting_scan',
          message: 'QR Code obtido da VPS com sucesso'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('[QR Async] ⏳ QR Code ainda não está pronto na VPS');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'QR Code ainda não disponível',
          waiting: true,
          instanceName: instance.instance_name,
          retryAfter: 10000,
          message: 'QR Code ainda sendo gerado. Tente novamente em alguns segundos.'
        }),
        { 
          status: 202, // Accepted - processing
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error: any) {
    console.error('[QR Async] 💥 ERRO GERAL CAPTURADO:', error);
    console.error('[QR Async] Stack trace:', error.stack);
    
    // Determinar status code apropriado
    let statusCode = 500;
    if (error.message.includes('não encontrado')) {
      statusCode = 404;
    } else if (error.message.includes('não tem acesso') || error.message.includes('inválido')) {
      statusCode = 403;
    } else if (error.message.includes('obrigatório')) {
      statusCode = 400;
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        action: 'qr_code_async_error_handling',
        timestamp: new Date().toISOString(),
        instanceId: instanceId,
        details: {
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 5)
        }
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
