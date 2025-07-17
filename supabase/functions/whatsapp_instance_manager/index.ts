import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Configuração VPS corrigida
const VPS_CONFIG = {
  baseUrl: 'http://31.97.163.57:3001',
  endpoints: {
    createInstance: '/instance/create',  // CORREÇÃO: Endpoint correto conforme server.js
    instanceInfo: '/instance/info',
    generateQR: '/instance/:instanceId/qr',
    deleteInstance: '/instance/logout'
  },
  webhookUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_qr_receiver'
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  console.log(`🚀 [${executionId}] WhatsApp Instance Manager iniciado`);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { action, instanceName, instanceId } = await req.json();
    console.log(`[${executionId}] Processando ação: ${action} para usuário: ${user.email}`);

    const vpsToken = Deno.env.get('VPS_API_TOKEN') || 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1';

    switch (action) {
      case 'create_instance': {
        console.log(`[${executionId}] 🚀 Criando instância com parâmetros:`, { instanceName, action });

        // CORREÇÃO: Determinar nome base - usar instanceName fornecido ou gerar baseado no email
        let baseInstanceName: string;
        
        if (instanceName && instanceName.trim()) {
          // Se nome foi fornecido, usar como base
          baseInstanceName = instanceName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
          console.log(`[${executionId}] 📝 Usando nome fornecido como base: ${baseInstanceName}`);
        } else {
          // Se não foi fornecido, gerar baseado no email do usuário
          baseInstanceName = user.email?.split('@')[0]?.toLowerCase()?.replace(/[^a-zA-Z0-9]/g, '') || 'user';
          console.log(`[${executionId}] 🔄 Gerando nome baseado no email: ${baseInstanceName}`);
        }
        
        // Verificar instâncias existentes para gerar numeração sequencial
        const { data: existingInstances } = await supabase
          .from('whatsapp_instances')
          .select('instance_name')
          .eq('created_by_user_id', user.id)
          .ilike('instance_name', `${baseInstanceName}%`);

        const existingNames = existingInstances?.map(i => i.instance_name) || [];
        console.log(`[${executionId}] 📋 Instâncias existentes encontradas: ${existingNames.length}`);
        
        // Gerar nome sequencial (baseInstanceName, baseInstanceName1, baseInstanceName2...)
        let intelligentName = baseInstanceName;
        let counter = 1;
        while (existingNames.includes(intelligentName)) {
          intelligentName = `${baseInstanceName}${counter}`;
          counter++;
          console.log(`[${executionId}] 🔄 Tentando: ${intelligentName}`);
        }

        console.log(`[${executionId}] 🎯 Nome final determinado: ${intelligentName}`);

        // ETAPA 1: Salvar no banco de dados PRIMEIRO
        const instanceRecord = {
          instance_name: intelligentName,  // CORREÇÃO: Usar nome inteligente
          vps_instance_id: intelligentName,  // CORREÇÃO: Usar mesmo nome para VPS
          created_by_user_id: user.id,
          connection_type: 'web',
          server_url: VPS_CONFIG.baseUrl,
          web_status: 'connecting',
          connection_status: 'connecting',
          qr_code: null,
          created_at: new Date().toISOString()
        };

        console.log(`[${executionId}] 💾 Salvando no banco de dados...`);
        const { data: savedInstance, error: saveError } = await supabase
          .from('whatsapp_instances')
          .insert(instanceRecord)
          .select()
          .single();

        if (saveError) {
          console.error(`[${executionId}] ❌ Erro ao salvar:`, saveError);
          throw new Error(`Erro ao salvar instância: ${saveError.message}`);
        }

        console.log(`[${executionId}] ✅ Instância salva no banco: ${savedInstance.id}`);

        // ETAPA 2: Criar na VPS - CORREÇÃO: Usar payload correto conforme server.js
        const vpsPayload = {
          instanceId: intelligentName,  // CORREÇÃO: Campo correto esperado pela VPS
          createdByUserId: user.id      // CORREÇÃO: Campo opcional mas útil
        };

        console.log(`[${executionId}] 🌐 Criando na VPS:`, vpsPayload);

        try {
          const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.createInstance}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${vpsToken}`
            },
            body: JSON.stringify(vpsPayload),
            signal: AbortSignal.timeout(30000)  // 30s timeout
          });

          if (!vpsResponse.ok) {
            const errorText = await vpsResponse.text();
            console.error(`[${executionId}] ❌ VPS falhou:`, errorText);
            
            // Marcar como erro mas manter no banco
            await supabase
              .from('whatsapp_instances')
              .update({
                web_status: 'vps_error',
                connection_status: 'disconnected'
              })
              .eq('id', savedInstance.id);

            throw new Error(`Falha ao criar instância na VPS: HTTP ${vpsResponse.status} - ${errorText}`);
          }

          const vpsData = await vpsResponse.json();
          console.log(`[${executionId}] ✅ VPS criou instância:`, vpsData);

          // Atualizar status após sucesso na VPS
          const { data: updatedInstance } = await supabase
            .from('whatsapp_instances')
            .update({
              web_status: 'waiting_scan',
              connection_status: 'connecting',
              updated_at: new Date().toISOString()
            })
            .eq('id', savedInstance.id)
            .select()
            .single();

          return new Response(JSON.stringify({
            success: true,
            instance: updatedInstance || savedInstance,
            vpsInstanceId: intelligentName,
            intelligentName: intelligentName,
            message: 'Instância criada com sucesso no banco e VPS',
            executionId
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });

        } catch (vpsError: any) {
          console.error(`[${executionId}] ❌ Erro na VPS:`, vpsError.message);
          
          // Marcar como erro mas manter no banco
          await supabase
            .from('whatsapp_instances')
            .update({
              web_status: 'vps_error',
              connection_status: 'disconnected'
            })
            .eq('id', savedInstance.id);

          // Retornar sucesso parcial (banco OK, VPS falhou)
          return new Response(JSON.stringify({
            success: true,
            instance: savedInstance,
            vpsInstanceId: intelligentName,
            intelligentName: intelligentName,
            message: 'Instância criada no banco, mas VPS falhou',
            vpsError: vpsError.message,
            executionId
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }

      case 'get_instance_info': {
        if (!instanceId) {
          throw new Error('instanceId é obrigatório');
        }

        const { data: instance, error: instanceError } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('id', instanceId)
          .single();

        if (instanceError || !instance) {
          throw new Error('Instância não encontrada');
        }

        return new Response(JSON.stringify({
          success: true,
          instance: instance,
          executionId
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      case 'health_check': {
        console.log(`[${executionId}] 🏥 Testando conectividade VPS`);

        try {
          const healthResponse = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${vpsToken}`
            },
            signal: AbortSignal.timeout(10000)  // 10s timeout para health check
          });

          if (!healthResponse.ok) {
            const errorText = await healthResponse.text();
            console.error(`[${executionId}] ❌ VPS health check falhou:`, {
              status: healthResponse.status,
              error: errorText
            });
            
            return new Response(JSON.stringify({
              success: false,
              error: `VPS não está respondendo: HTTP ${healthResponse.status}`,
              details: {
                url: `${VPS_CONFIG.baseUrl}/health`,
                status: healthResponse.status,
                response: errorText
              },
              executionId
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }

          const healthData = await healthResponse.json();
          console.log(`[${executionId}] ✅ VPS health check OK:`, healthData);

          return new Response(JSON.stringify({
            success: true,
            message: 'VPS está respondendo corretamente',
            healthData: healthData,
            vpsConfig: {
              baseUrl: VPS_CONFIG.baseUrl,
              endpoint: '/health'
            },
            executionId
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });

        } catch (healthError: any) {
          console.error(`[${executionId}] ❌ Erro no health check:`, {
            message: healthError.message,
            name: healthError.name
          });
          
          return new Response(JSON.stringify({
            success: false,
            error: `Erro ao conectar com VPS: ${healthError.message}`,
            details: {
              url: `${VPS_CONFIG.baseUrl}/health`,
              errorType: healthError.name,
              errorMessage: healthError.message
            },
            executionId
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }

      default:
        throw new Error(`Ação não suportada: ${action}`);
    }

  } catch (error: any) {
    console.error(`❌ [${executionId}] Erro na Edge Function:`, error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      executionId
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 