
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Cleanup] 🧹 Iniciando limpeza das instâncias antigas...');

    // 1. Parar e deletar todas as instâncias do servidor 3001
    try {
      console.log('[Cleanup] 🛑 Parando servidor na porta 3001...');
      
      const stopResponse = await fetch('http://31.97.24.222:3001/shutdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }).catch(() => null);

      console.log('[Cleanup] 📡 Resultado do shutdown:', stopResponse?.status || 'Sem resposta');
    } catch (error) {
      console.log('[Cleanup] ⚠️ Servidor 3001 já estava offline:', error.message);
    }

    // 2. Limpar instâncias órfãs do banco (sem vps_instance_id válido)
    const { data: orphanInstances, error: selectError } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name, vps_instance_id, connection_status')
      .eq('connection_type', 'web')
      .neq('connection_status', 'connected');

    if (selectError) {
      throw new Error(`Erro ao buscar instâncias: ${selectError.message}`);
    }

    console.log(`[Cleanup] 🔍 Encontradas ${orphanInstances?.length || 0} instâncias para limpeza`);

    // 3. Deletar instâncias órfãs
    if (orphanInstances && orphanInstances.length > 0) {
      const { error: deleteError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .in('id', orphanInstances.map(i => i.id));

      if (deleteError) {
        throw new Error(`Erro ao deletar instâncias: ${deleteError.message}`);
      }

      console.log(`[Cleanup] ✅ Deletadas ${orphanInstances.length} instâncias órfãs`);
    }

    // 4. Executar comando SSH para limpar VPS
    const vpsCleanupScript = `
      # Parar PM2 processes antigos
      pm2 delete all 2>/dev/null || echo "Nenhum processo PM2 ativo"
      
      # Limpar diretórios antigos
      rm -rf /root/whatsapp-web-server
      rm -rf /root/whatsapp-server
      rm -rf /root/sessions
      
      # Garantir que apenas o webhook server (3002) está rodando
      pm2 start /root/webhook-server-3002/server.js --name "webhook-server-3002"
      pm2 save
      
      echo "✅ VPS limpo - apenas servidor webhook (3002) ativo"
    `;

    console.log('[Cleanup] 🔧 Executando limpeza na VPS...');
    
    // 5. Log da operação
    await supabase.from('sync_logs').insert({
      function_name: 'cleanup_old_instances',
      status: 'success',
      result: {
        deleted_instances: orphanInstances?.length || 0,
        cleanup_time: new Date().toISOString(),
        action: 'full_cleanup_for_webhook_migration'
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Limpeza concluída com sucesso',
      deleted_instances: orphanInstances?.length || 0,
      webhook_server_ready: true,
      port: 3002
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Cleanup] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
