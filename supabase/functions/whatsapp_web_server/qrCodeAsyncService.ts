
import { corsHeaders, VPS_CONFIG, getVPSHeaders, normalizeQRCode } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const getQRId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 🔍 DESCOBERTA QR CODE - Iniciando [${getQRId}]:`, instanceData.instanceId);

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('ID da instância é obrigatório para obter QR Code');
    }

    // Buscar instância no banco para obter vps_instance_id
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, connection_status, qr_code')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code Async] ❌ Instância não encontrada:`, instanceError);
      throw new Error('Instância não encontrada no banco de dados');
    }

    const vpsInstanceId = instance.vps_instance_id;
    if (!vpsInstanceId) {
      throw new Error('VPS Instance ID não encontrado para esta instância');
    }

    console.log(`[QR Code Async] 🎯 DESCOBERTA QR CODE - Testando múltiplas opções para: ${vpsInstanceId}`);

    // DESCOBERTA AUTOMÁTICA DE QR CODE: Múltiplas possibilidades
    const qrTestConfigurations = [
      // Opção 1: GET com vps_instance_id na URL
      {
        method: 'GET',
        endpoint: `/instance/${vpsInstanceId}/qr`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      // Opção 2: GET com token
      {
        method: 'GET',
        endpoint: `/instance/${vpsInstanceId}/qr`,
        headers: getVPSHeaders(),
        body: null
      },
      // Opção 3: POST com instanceId no body
      {
        method: 'POST',
        endpoint: '/instance/qr',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: vpsInstanceId })
      },
      // Opção 4: POST com sessionName
      {
        method: 'POST',
        endpoint: '/qr/get',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName: vpsInstanceId })
      },
      // Opção 5: GET simples
      {
        method: 'GET',
        endpoint: `/qr/${vpsInstanceId}`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      // Opção 6: POST com instance
      {
        method: 'POST',
        endpoint: '/get-qr',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance: vpsInstanceId })
      },
      // Opção 7: GET status que pode incluir QR
      {
        method: 'GET',
        endpoint: `/instance/${vpsInstanceId}/status`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      // Opção 8: POST status
      {
        method: 'POST',
        endpoint: '/instance/status',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: vpsInstanceId })
      },
      // Opção 9: WebSocket style
      {
        method: 'GET',
        endpoint: `/session/${vpsInstanceId}/qr`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      // Opção 10: WhatsApp Web style
      {
        method: 'GET',
        endpoint: `/whatsapp/${vpsInstanceId}/qr`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      }
    ];

    let successfulQR = null;
    let testCount = 0;

    for (const config of qrTestConfigurations) {
      testCount++;
      
      try {
        console.log(`[QR Code Async] 🧪 TESTE QR ${testCount}/10 - ${config.method} ${config.endpoint}`);
        
        const requestOptions: any = {
          method: config.method,
          headers: config.headers
        };

        if (config.body) {
          requestOptions.body = config.body;
        }

        const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${config.endpoint}`, requestOptions);

        console.log(`[QR Code Async] 📊 TESTE QR ${testCount} - Status: ${response.status}`);

        if (response.ok) {
          const responseData = await response.json();
          console.log(`[QR Code Async] 📋 TESTE QR ${testCount} - Response:`, responseData);

          // Tentar extrair QR Code da resposta
          const extractedQR = normalizeQRCode(responseData);
          
          if (extractedQR) {
            console.log(`[QR Code Async] 🎉 TESTE QR ${testCount} - QR CODE ENCONTRADO!`);
            successfulQR = {
              testNumber: testCount,
              qrCode: extractedQR,
              source: 'vps_api',
              method: config.method,
              endpoint: config.endpoint,
              response: responseData
            };
            break;
          } else {
            console.log(`[QR Code Async] ⚠️ TESTE QR ${testCount} - Resposta OK mas sem QR Code válido`);
          }
        } else {
          const errorText = await response.text();
          console.log(`[QR Code Async] ❌ TESTE QR ${testCount} - Falhou: ${response.status} - ${errorText.substring(0, 100)}`);
        }

      } catch (error: any) {
        console.error(`[QR Code Async] ❌ TESTE QR ${testCount} - Erro:`, error.message);
      }

      // Pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (!successfulQR) {
      console.log(`[QR Code Async] ⏳ Nenhum QR Code encontrado nos ${testCount} testes - pode ainda estar sendo gerado`);
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          message: `QR Code ainda não disponível (${testCount} testes realizados)`,
          getQRId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // QR Code encontrado! Salvar no banco
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({ 
        qr_code: successfulQR.qrCode,
        connection_status: 'waiting_qr',
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (updateError) {
      console.error(`[QR Code Async] ❌ Erro ao salvar QR no banco:`, updateError);
    } else {
      console.log(`[QR Code Async] ✅ QR Code salvo no banco com sucesso`);
    }

    console.log(`[QR Code Async] 🎉 QR Code obtido com TESTE ${successfulQR.testNumber} [${getQRId}]`);

    return new Response(
      JSON.stringify({
        success: true,
        qrCode: successfulQR.qrCode,
        source: successfulQR.source,
        savedToDatabase: !updateError,
        testUsed: successfulQR.testNumber,
        method: successfulQR.method,
        endpoint: successfulQR.endpoint,
        getQRId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[QR Code Async] ❌ Erro crítico [${getQRId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        getQRId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
