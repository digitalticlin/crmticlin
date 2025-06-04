
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, testVPSConnection } from './config.ts';
import { createWhatsAppInstance, deleteWhatsAppInstance } from './instanceManagement.ts';
import { getInstanceStatus, getQRCode } from './instanceStatusService.ts';
import { getQRCodeFromVPS, updateQRCodeInDatabase } from './qrCodeService.ts';
import { authenticateRequest } from './authentication.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // CORREÇÃO FASE 3.1.1: Autenticar usuário ANTES de processar qualquer ação
    const user = await authenticateRequest(req, supabase);
    console.log(`[WhatsApp Server] 🔐 Usuário autenticado: ${user.id} (${user.email})`);

    const { action, instanceData, vpsAction } = await req.json();
    console.log(`[WhatsApp Server] 🔧 Action: ${action} (FASE 3.1.1 - com auth corrigida)`);

    switch (action) {
      case 'create_instance':
        // CORREÇÃO FASE 3.1.1: Passar userId correto ao invés do objeto req
        console.log(`[WhatsApp Server] 🚀 Criando instância para usuário: ${user.id}`);
        return await createWhatsAppInstance(supabase, instanceData, user.id);

      case 'delete_instance':
        return await deleteWhatsAppInstance(supabase, instanceData.instanceId);

      case 'get_status':
        return await getInstanceStatus(instanceData.instanceId);

      case 'get_qr_code':
        return await getQRCode(instanceData.instanceId);

      case 'refresh_qr_code':
        console.log('[WhatsApp Server] 🔄 Atualizando QR Code (FASE 3.1.1)');
        const qrResult = await getQRCodeFromVPS(instanceData.instanceId);
        
        if (qrResult.success) {
          // Atualizar no banco
          await updateQRCodeInDatabase(supabase, instanceData.instanceId, qrResult);
          
          return new Response(
            JSON.stringify({
              success: true,
              qrCode: qrResult.qrCode,
              status: qrResult.status,
              timestamp: qrResult.timestamp
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: qrResult.error
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

      case 'check_server':
        console.log('[WhatsApp Server] 🔍 Verificando servidor (FASE 3.1.1)');
        const vpsTest = await testVPSConnection();
        
        return new Response(
          JSON.stringify({
            success: vpsTest.success,
            details: vpsTest.details,
            error: vpsTest.error,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'sync_instances':
        console.log('[WhatsApp Server] 🔄 Sincronizando instâncias (FASE 3.1.1)');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Sync completed',
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown action: ${action}` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('[WhatsApp Server] ❌ Erro geral (FASE 3.1.1):', error);
    
    // CORREÇÃO FASE 3.1.1: Melhor tratamento de erros de autenticação
    if (error.message.includes('Authorization') || error.message.includes('authentication')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication failed',
          details: error.message,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
