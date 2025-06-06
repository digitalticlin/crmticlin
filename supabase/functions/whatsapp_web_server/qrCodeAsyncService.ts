
import { corsHeaders, VPS_CONFIG, getVPSHeaders, normalizeQRCode } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const getQRId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 🔍 NOVA DESCOBERTA MASSIVA - Iniciando [${getQRId}]:`, instanceData.instanceId);

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

    console.log(`[QR Code Async] 🎯 NOVA DESCOBERTA MASSIVA - Testando centenas de combinações para: ${vpsInstanceId}`);

    // NOVA DESCOBERTA MASSIVA: Muito mais opções
    const qrMassiveTestConfigurations = [
      // ====== GRUPO 1: APIs REST Clássicas ======
      {
        method: 'GET',
        endpoint: `/api/qr/${vpsInstanceId}`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/api/qrcode/${vpsInstanceId}`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/api/instances/${vpsInstanceId}/qr`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/api/whatsapp/${vpsInstanceId}/qr`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/api/session/${vpsInstanceId}/qr`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },

      // ====== GRUPO 2: WhatsApp Web.js Específico ======
      {
        method: 'GET',
        endpoint: `/whatsapp-web/${vpsInstanceId}/qr`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/webjs/${vpsInstanceId}/qr`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/web/${vpsInstanceId}/qrcode`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/client/${vpsInstanceId}/qr`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },

      // ====== GRUPO 3: Evolution API Style ======
      {
        method: 'GET',
        endpoint: `/instance/connect/${vpsInstanceId}`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/instance/qrCode/${vpsInstanceId}`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/instance/qr_code/${vpsInstanceId}`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },

      // ====== GRUPO 4: Venom Bot Style ======
      {
        method: 'POST',
        endpoint: '/generate-qr',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: vpsInstanceId })
      },
      {
        method: 'POST',
        endpoint: '/qr/generate',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName: vpsInstanceId })
      },
      {
        method: 'POST',
        endpoint: '/session/qr',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance: vpsInstanceId })
      },

      // ====== GRUPO 5: Baileys Style ======
      {
        method: 'GET',
        endpoint: `/baileys/${vpsInstanceId}/qr`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'POST',
        endpoint: '/baileys/qr',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceKey: vpsInstanceId })
      },

      // ====== GRUPO 6: URLs sem versioning ======
      {
        method: 'GET',
        endpoint: `/qr`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'POST',
        endpoint: '/qr',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: vpsInstanceId })
      },
      {
        method: 'POST',
        endpoint: '/qr',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance: vpsInstanceId })
      },

      // ====== GRUPO 7: Com diferentes tokens ======
      {
        method: 'GET',
        endpoint: `/instance/${vpsInstanceId}/qr`,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer default-token'
        },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/instance/${vpsInstanceId}/qr`,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dc0b3'
        },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/instance/${vpsInstanceId}/qr`,
        headers: { 
          'Content-Type': 'application/json',
          'X-API-KEY': '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dc0b3'
        },
        body: null
      },

      // ====== GRUPO 8: Status endpoints que retornam QR ======
      {
        method: 'GET',
        endpoint: `/instance/${vpsInstanceId}/connectionState`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/instance/${vpsInstanceId}/state`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/instance/${vpsInstanceId}/info`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },

      // ====== GRUPO 9: Endpoints com diferentes formatos ======
      {
        method: 'POST',
        endpoint: '/instance/status',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instanceName: vpsInstanceId,
          getQrCode: true 
        })
      },
      {
        method: 'POST',
        endpoint: '/status',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instance: vpsInstanceId,
          includeQR: true 
        })
      },

      // ====== GRUPO 10: Connect endpoints ======
      {
        method: 'POST',
        endpoint: '/connect',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: vpsInstanceId })
      },
      {
        method: 'POST',
        endpoint: '/instance/connect',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: vpsInstanceId })
      },

      // ====== GRUPO 11: Base64 específicos ======
      {
        method: 'GET',
        endpoint: `/instance/${vpsInstanceId}/qr/base64`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: `/qr/${vpsInstanceId}/base64`,
        headers: { 'Content-Type': 'application/json' },
        body: null
      },

      // ====== GRUPO 12: Restart e generate ======
      {
        method: 'POST',
        endpoint: `/instance/${vpsInstanceId}/restart`,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateQR: true })
      },
      {
        method: 'POST',
        endpoint: '/instance/restart',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instanceId: vpsInstanceId,
          generateQR: true 
        })
      }
    ];

    let successfulQR = null;
    let testCount = 0;

    for (const config of qrMassiveTestConfigurations) {
      testCount++;
      
      try {
        console.log(`[QR Code Async] 🧪 TESTE MASSIVO ${testCount}/${qrMassiveTestConfigurations.length} - ${config.method} ${config.endpoint}`);
        
        const requestOptions: any = {
          method: config.method,
          headers: config.headers
        };

        if (config.body) {
          requestOptions.body = config.body;
        }

        const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${config.endpoint}`, requestOptions);

        console.log(`[QR Code Async] 📊 TESTE MASSIVO ${testCount} - Status: ${response.status}`);

        if (response.ok) {
          const responseData = await response.json();
          console.log(`[QR Code Async] 📋 TESTE MASSIVO ${testCount} - Response:`, responseData);

          // Tentar extrair QR Code da resposta
          const extractedQR = normalizeQRCode(responseData);
          
          if (extractedQR) {
            console.log(`[QR Code Async] 🎉 TESTE MASSIVO ${testCount} - QR CODE BASE64 ENCONTRADO! 🎉`);
            successfulQR = {
              testNumber: testCount,
              qrCode: extractedQR,
              source: 'vps_api_massive_discovery',
              method: config.method,
              endpoint: config.endpoint,
              response: responseData
            };
            break;
          } else {
            console.log(`[QR Code Async] ⚠️ TESTE MASSIVO ${testCount} - Resposta OK mas sem QR Code válido`);
          }
        } else {
          const errorText = await response.text();
          console.log(`[QR Code Async] ❌ TESTE MASSIVO ${testCount} - Falhou: ${response.status} - ${errorText.substring(0, 100)}`);
        }

      } catch (error: any) {
        console.error(`[QR Code Async] ❌ TESTE MASSIVO ${testCount} - Erro:`, error.message);
      }

      // Pausa menor entre testes para acelerar descoberta
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!successfulQR) {
      console.log(`[QR Code Async] ⏳ Nenhum QR Code encontrado nos ${testCount} testes massivos - pode ainda estar sendo gerado`);
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          message: `QR Code ainda não disponível (${testCount} testes massivos realizados)`,
          getQRId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // QR Code encontrado! Salvar no banco como Base64 URL
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({ 
        qr_code: successfulQR.qrCode,
        connection_status: 'waiting_qr',
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (updateError) {
      console.error(`[QR Code Async] ❌ Erro ao salvar QR Base64 no banco:`, updateError);
    } else {
      console.log(`[QR Code Async] ✅ QR Code Base64 salvo no Supabase com sucesso`);
    }

    console.log(`[QR Code Async] 🎉 QR Code Base64 obtido com TESTE MASSIVO ${successfulQR.testNumber} [${getQRId}]`);

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
