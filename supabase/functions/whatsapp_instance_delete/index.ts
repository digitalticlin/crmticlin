import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ CONFIGURAÇÃO VPS PADRONIZADA
const VPS_CONFIG = {
  baseUrl: Deno.env.get('VPS_BASE_URL')!,
  authToken: Deno.env.get('VPS_API_TOKEN') ?? '',
  timeout: Number(Deno.env.get('VPS_TIMEOUT_MS') ?? '60000')
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const executionId = `delete_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  console.log(`🗑️ [${executionId}] WHATSAPP INSTANCE DELETE - VERSÃO CORRIGIDA`);

  try {
    console.log('[Instance Delete] 🚀 Iniciando processamento - VERSÃO CORRIGIDA V2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // ✅ AUTENTICAÇÃO OBRIGATÓRIA
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Instance Delete] ❌ Token de autorização ausente ou malformado');
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorização obrigatório (Bearer token)',
        executionId
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ LER BODY UMA ÚNICA VEZ
    const requestBody = await req.json();
    console.log(`[${executionId}] 📦 Body recebido:`, JSON.stringify(requestBody, null, 2));
    
    // ✅ VERIFICAR TIPO DE TOKEN: SERVICE ROLE vs USER TOKEN
    const isServiceRoleCall = authHeader.includes(supabaseServiceKey.substring(0, 20));
    console.log(`[${executionId}] 🔑 Tipo de chamada:`, isServiceRoleCall ? 'SERVICE_ROLE (Database Trigger)' : 'USER_TOKEN (Frontend)');
    
    let userId: string;
    
    if (isServiceRoleCall) {
      // ✅ CHAMADA DO TRIGGER - usar service role com permissões especiais
      console.log(`[${executionId}] 🔧 Processando chamada do trigger com service role`);
      
      const { instanceId, trigger_source, userId: providedUserId } = requestBody;
      
      if (!providedUserId) {
        console.log(`[${executionId}] 🔄 FALLBACK: userId não enviado pelo trigger, buscando no banco...`);
        
        // ✅ FALLBACK: Buscar userId da instância no banco
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: instanceData, error: fetchError } = await supabase
          .from('whatsapp_instances')
          .select('created_by_user_id')
          .eq('id', instanceId)
          .single();
          
        if (fetchError || !instanceData) {
          console.error(`[${executionId}] ❌ Não foi possível buscar userId para instanceId: ${instanceId}`);
          return new Response(JSON.stringify({
            success: false,
            error: 'Instância não encontrada para buscar userId',
            executionId,
            receivedBody: requestBody
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        userId = instanceData.created_by_user_id;
        console.log(`[${executionId}] ✅ FALLBACK: userId encontrado no banco: ${userId}`);
      } else {
        userId = providedUserId;
      }
      
    } else {
      // ✅ CHAMADA DO FRONTEND - usar validação normal de usuário
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      });

      const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
      if (authError || !user) {
        console.error('[Instance Delete] ❌ Usuário não autenticado:', authError?.message);
        return new Response(JSON.stringify({
          success: false,
          error: 'Usuário não autenticado',
          executionId
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      userId = user.id;
    }

    // ✅ VERIFICAÇÃO DE TOKEN VPS
    if (!VPS_CONFIG.authToken) {
      console.error('[Instance Delete] ❌ VPS_API_TOKEN não configurado');
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuração VPS incompleta - token não encontrado',
        executionId
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ CLIENTE SERVICE ROLE PARA OPERAÇÕES PRIVILEGIADAS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // ✅ OBTER DADOS DA REQUISIÇÃO - usar dados já lidos acima
    const { instanceId, trigger_source } = requestBody;
    
    console.log(`🗑️ [${executionId}] Deletando instância: ${instanceId}`, 
                trigger_source ? `(fonte: ${trigger_source})` : '',
                `(userId: ${userId})`);

    if (!instanceId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "instanceId é obrigatório",
        executionId 
      }), { 
        headers: corsHeaders, 
        status: 400 
      });
    }

    // ✅ BUSCAR INSTÂNCIA VERIFICANDO PROPRIEDADE DO USUÁRIO
    console.log(`🔍 [${executionId}] Buscando instância no banco...`);
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (fetchError || !instance) {
      console.error(`❌ [${executionId}] Instância não encontrada para o usuário:`, {
        instanceId,
        userId: userId,
        error: fetchError?.message
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Instância não encontrada ou não pertence ao usuário",
        executionId 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 404 
      });
    }

    console.log(`✅ [${executionId}] Instância encontrada:`, {
      id: instance.id,
      name: instance.instance_name,
      vps_instance_id: instance.vps_instance_id
    });

    // 2. DELETAR DA VPS COMPLETAMENTE (incluindo pasta AUTH)
    let vpsDeleteSuccess = false;
    
    if (instance.vps_instance_id) {
      console.log(`🌐 [${executionId}] Deletando COMPLETAMENTE da VPS (incluindo AUTH): ${instance.vps_instance_id}`);
      
      try {
        // 🔄 ESTRATÉGIA MÚLTIPLA: Tentar diferentes endpoints para garantir deleção completa
        
        // 1️⃣ MÉTODO 1: Endpoint específico de deleção completa
        console.log(`🎯 [${executionId}] Tentativa 1: DELETE completo com cleanup`);
        const deleteCompleteEndpoint = `${VPS_CONFIG.baseUrl}/instance/${instance.vps_instance_id}/delete-complete`;
        
        try {
          const deleteCompleteResponse = await fetch(deleteCompleteEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
              'x-api-token': VPS_CONFIG.authToken,
              'User-Agent': 'Supabase-Edge-Function/1.0'
            },
            body: JSON.stringify({ 
              instanceId: instance.vps_instance_id,
              cleanupAuth: true,
              forceDelete: true 
            }),
            signal: AbortSignal.timeout(45000) // Timeout maior para operação completa
          });

          if (deleteCompleteResponse.ok) {
            const completeData = await deleteCompleteResponse.json();
            console.log(`✅ [${executionId}] VPS delete-complete SUCCESS:`, completeData);
            vpsDeleteSuccess = true;
          } else {
            console.log(`⚠️ [${executionId}] Delete-complete falhou, tentando método alternativo...`);
          }
        } catch (completeError) {
          console.log(`⚠️ [${executionId}] Delete-complete exception:`, completeError.message);
        }

        // 2️⃣ MÉTODO 2: Se método 1 falhar, usar DELETE padrão + cleanup AUTH
        if (!vpsDeleteSuccess) {
          console.log(`🎯 [${executionId}] Tentativa 2: DELETE padrão + cleanup AUTH`);
          
          // 2a: DELETE padrão da instância
          const standardDeleteEndpoint = `${VPS_CONFIG.baseUrl}/instance/${instance.vps_instance_id}`;
          const standardResponse = await fetch(standardDeleteEndpoint, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
              'x-api-token': VPS_CONFIG.authToken,
              'User-Agent': 'Supabase-Edge-Function/1.0'
            },
            signal: AbortSignal.timeout(30000)
          });

          const standardSuccess = standardResponse.ok;
          console.log(`🔄 [${executionId}] DELETE padrão:`, standardSuccess ? 'SUCCESS' : 'FAILED');

          // 2b: Cleanup específico da pasta AUTH
          try {
            const authCleanupEndpoint = `${VPS_CONFIG.baseUrl}/instance/${instance.vps_instance_id}/cleanup-auth`;
            const authResponse = await fetch(authCleanupEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
                'x-api-token': VPS_CONFIG.authToken
              },
              body: JSON.stringify({ forceCleanup: true }),
              signal: AbortSignal.timeout(20000)
            });

            const authSuccess = authResponse.ok;
            console.log(`🔄 [${executionId}] AUTH cleanup:`, authSuccess ? 'SUCCESS' : 'FAILED');
            
            // Considerar sucesso se pelo menos um dos dois funcionou
            vpsDeleteSuccess = standardSuccess || authSuccess;
            
          } catch (authError) {
            console.log(`⚠️ [${executionId}] AUTH cleanup exception:`, authError.message);
            vpsDeleteSuccess = standardSuccess; // Pelo menos o delete padrão funcionou
          }
        }

        // 3️⃣ MÉTODO 3: ÚLTIMO RECURSO - Logout + Force Cleanup
        if (!vpsDeleteSuccess) {
          console.log(`🎯 [${executionId}] ÚLTIMO RECURSO: Logout + Force Cleanup`);
          
          try {
            // Logout primeiro
            const logoutResponse = await fetch(`${VPS_CONFIG.baseUrl}/instance/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
                'x-api-token': VPS_CONFIG.authToken
              },
              body: JSON.stringify({ instanceId: instance.vps_instance_id }),
              signal: AbortSignal.timeout(20000)
            });

            // Force cleanup depois
            const forceCleanupResponse = await fetch(`${VPS_CONFIG.baseUrl}/cleanup/force`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
                'x-api-token': VPS_CONFIG.authToken
              },
              body: JSON.stringify({ 
                instanceId: instance.vps_instance_id,
                removeFiles: true,
                removeAuth: true 
              }),
              signal: AbortSignal.timeout(30000)
            });

            const logoutSuccess = logoutResponse.ok;
            const cleanupSuccess = forceCleanupResponse.ok;
            
            console.log(`🔄 [${executionId}] Logout:`, logoutSuccess ? 'SUCCESS' : 'FAILED');
            console.log(`🔄 [${executionId}] Force cleanup:`, cleanupSuccess ? 'SUCCESS' : 'FAILED');
            
            vpsDeleteSuccess = logoutSuccess || cleanupSuccess;
            
          } catch (lastResortError) {
            console.error(`❌ [${executionId}] Último recurso falhou:`, lastResortError.message);
          }
        }

        // 📊 VALIDAÇÃO FINAL: Verificar se instância ainda existe na VPS
        if (vpsDeleteSuccess) {
          console.log(`🔍 [${executionId}] Verificando se instância foi realmente removida da VPS...`);
          
          try {
            const verifyEndpoint = `${VPS_CONFIG.baseUrl}/instance/${instance.vps_instance_id}/status`;
            const verifyResponse = await fetch(verifyEndpoint, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
                'x-api-token': VPS_CONFIG.authToken
              },
              signal: AbortSignal.timeout(10000)
            });

            if (verifyResponse.status === 404) {
              console.log(`✅ [${executionId}] CONFIRMADO: Instância não existe mais na VPS (404)`);
            } else if (verifyResponse.ok) {
              console.error(`⚠️ [${executionId}] ATENÇÃO: Instância ainda existe na VPS apesar do "sucesso"`);
              const statusData = await verifyResponse.json().catch(() => null);
              console.error(`⚠️ [${executionId}] Status da instância:`, statusData);
              
              // Marcar como falha se instância ainda existe
              vpsDeleteSuccess = false;
            } else {
              console.log(`⚠️ [${executionId}] Não foi possível verificar status da instância (${verifyResponse.status})`);
            }
          } catch (verifyError) {
            console.log(`⚠️ [${executionId}] Erro ao verificar status:`, verifyError.message);
          }
        }

        // 📊 RESULTADO FINAL
        if (vpsDeleteSuccess) {
          console.log(`✅ [${executionId}] VPS deleção COMPLETA e VERIFICADA bem-sucedida!`);
        } else {
          console.error(`❌ [${executionId}] FALHA CRÍTICA: VPS não foi deletada após todas as tentativas!`);
          console.error(`❌ [${executionId}] ISSO CAUSARÁ ERRO HTTP 409 em futuras criações!`);
          
          // Log para diagnostico
          console.error(`🔧 [${executionId}] DIAGNÓSTICO: Instância ${instance.vps_instance_id} pode ainda existir em:`, {
            authPath: `/path/to/auth/${instance.vps_instance_id}`,
            sessionPath: `/path/to/sessions/${instance.vps_instance_id}`,
            instancePath: `/path/to/instances/${instance.vps_instance_id}`
          });
        }

      } catch (error: any) {
        console.error(`❌ [${executionId}] VPS delete error geral:`, {
          message: error.message,
          name: error.name
        });
        vpsDeleteSuccess = false;
      }
    } else {
      console.log(`⚠️ [${executionId}] Sem vps_instance_id, pulando VPS`);
      vpsDeleteSuccess = true; // Considerar sucesso se não há ID da VPS
    }

    // 3. DELETAR DO BANCO COM PROTEÇÃO ANTI-LOOP
    console.log(`🗄️ [${executionId}] Deletando do banco...`);
    
    // ✅ PROTEÇÃO: Verificar se a requisição veio do próprio trigger para evitar loop infinito
    const isFromTrigger = trigger_source === 'database_delete_trigger';
    
    if (isFromTrigger) {
      console.log(`⚠️ [${executionId}] Requisição veio do trigger - pulando deleção no banco para evitar loop`);
      return new Response(JSON.stringify({
        success: true,
        message: "Processamento do trigger concluído",
        details: {
          instanceId,
          instanceName: instance.instance_name,
          vpsDeleted: vpsDeleteSuccess,
          databaseDeleted: false,
          source: 'trigger'
        },
        executionId
      }), { 
        headers: corsHeaders,
        status: 200
      });
    }
    
    // ✅ TIMEOUT CONFIGURÁVEL PARA DELETE
    const deleteTimeoutMs = 30000; // 30 segundos
    const deletePromise = supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId)
      .eq('created_by_user_id', userId); // Extra segurança
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DELETE timeout')), deleteTimeoutMs)
    );
    
    try {
      const { error: deleteError } = await Promise.race([deletePromise, timeoutPromise]);
      
      if (deleteError) {
        console.error(`❌ [${executionId}] Erro ao deletar do banco:`, deleteError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Erro ao deletar do banco: ${deleteError.message}`,
          executionId 
        }), { 
          headers: corsHeaders, 
          status: 500 
        });
      }
    } catch (timeoutError) {
      console.error(`❌ [${executionId}] Timeout ao deletar do banco:`, timeoutError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Timeout na operação de deleção no banco de dados",
        details: "A operação excedeu 30 segundos. Verifique se há locks na tabela.",
        executionId 
      }), { 
        headers: corsHeaders, 
        status: 408 
      });
    }

    console.log(`✅ [${executionId}] Instância deletada com sucesso do banco`);

    // 4. RESULTADO FINAL - SEMPRE SUCESSO SE DELETOU DO BANCO
    console.log(`🎉 [${executionId}] Deleção concluída:`, {
      success: true,
      vpsDeleteSuccess,
      instanceId,
      instanceName: instance.instance_name
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Instância deletada com sucesso",
      details: {
        instanceId,
        instanceName: instance.instance_name,
        vpsDeleted: vpsDeleteSuccess,
        databaseDeleted: true
      },
      executionId
    }), { 
      headers: corsHeaders,
      status: 200
    });

  } catch (error: any) {
    console.error(`❌ [${executionId}] Erro geral:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Erro interno do servidor",
      type: error.name || "UnknownError",
      executionId
    }), { 
      headers: corsHeaders, 
      status: 500 
    });
  }
});
