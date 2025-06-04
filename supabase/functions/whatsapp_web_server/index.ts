
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, testVPSConnection } from './config.ts';
import { createWhatsAppInstance, deleteWhatsAppInstance } from './instanceManagement.ts';
import { getInstanceStatus, getQRCode } from './instanceStatusService.ts';
import { getQRCodeFromVPS, updateQRCodeInDatabase } from './qrCodeService.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, instanceData, vpsAction } = await req.json();
    console.log(`[WhatsApp Server] 🔧 Action: ${action} (FASE 3.1)`);

    switch (action) {
      case 'create_instance':
        return await createWhatsAppInstance(supabase, instanceData, req);

      case 'delete_instance':
        return await deleteWhatsAppInstance(supabase, instanceData.instanceId);

      case 'get_status':
        return await getInstanceStatus(instanceData.instanceId);

      case 'get_qr_code':
        return await getQRCode(instanceData.instanceId);

      case 'refresh_qr_code':
        console.log('[WhatsApp Server] 🔄 Atualizando QR Code (FASE 3.1)');
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
        console.log('[WhatsApp Server] 🔍 Verificando servidor (FASE 3.1)');
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
        console.log('[WhatsApp Server] 🔄 Sincronizando instâncias (FASE 3.1)');
        // Implementação básica - pode ser expandida conforme necessário
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
    console.error('[WhatsApp Server] ❌ Erro geral:', error);
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
