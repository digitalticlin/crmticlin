// Edge Function para deletar instâncias Puppeteer da VPS
// Versão 1.0 - Delete VPS Instances

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, sessionId, instanceId } = body;

    console.log(`[Delete Puppeteer] 🗑️ Action: ${action}`);
    console.log(`[Delete Puppeteer] 📋 SessionId: ${sessionId}, InstanceId: ${instanceId}`);

    switch (action) {
      case 'delete_single_instance':
        return await deleteSingleInstance(sessionId);
      
      case 'delete_all_instances':
        return await deleteAllInstances();
      
      case 'cleanup_database':
        return await cleanupDatabase(supabase);
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[Delete Puppeteer] ❌ Error:', error);
    
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

// 🗑️ Deletar uma instância específica da VPS
async function deleteSingleInstance(sessionId: string) {
  try {
    console.log(`[Delete Puppeteer] 🎯 Deletando sessão: ${sessionId}`);

    const vpsUrl = Deno.env.get('VPS_PUPPETEER_IMPORT') || 'http://31.97.163.57:3001';
    const deleteUrl = `${vpsUrl}/session/${sessionId}`;

    console.log(`[Delete Puppeteer] 🌐 Chamando: ${deleteUrl}`);

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[Delete Puppeteer] ✅ Sessão deletada com sucesso: ${sessionId}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Session ${sessionId} deleted successfully`,
          vpsResponse: result
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      console.error(`[Delete Puppeteer] ❌ Erro na VPS: ${response.status} - ${errorText}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `VPS Error: ${response.status} - ${errorText}`,
          sessionId
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error(`[Delete Puppeteer] ❌ Erro ao deletar sessão ${sessionId}:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        sessionId
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// 🗑️ Deletar TODAS as instâncias da VPS
async function deleteAllInstances() {
  try {
    console.log(`[Delete Puppeteer] 🔥 Deletando TODAS as instâncias da VPS`);

    const vpsUrl = Deno.env.get('VPS_PUPPETEER_IMPORT') || 'http://31.97.163.57:3001';
    
    // 1. Listar todas as sessões
    const listUrl = `${vpsUrl}/sessions`;
    console.log(`[Delete Puppeteer] 📋 Listando sessões: ${listUrl}`);

    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list sessions: ${listResponse.status}`);
    }

    const sessions = await listResponse.json();
    console.log(`[Delete Puppeteer] 📊 Encontradas ${sessions.length} sessões`);

    // 2. Deletar cada sessão individualmente
    const deleteResults = [];
    for (const session of sessions) {
      try {
        const deleteUrl = `${vpsUrl}/session/${session.sessionId}`;
        console.log(`[Delete Puppeteer] 🗑️ Deletando: ${session.sessionId}`);

        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (deleteResponse.ok) {
          deleteResults.push({
            sessionId: session.sessionId,
            status: 'deleted',
            success: true
          });
          console.log(`[Delete Puppeteer] ✅ Deletado: ${session.sessionId}`);
        } else {
          deleteResults.push({
            sessionId: session.sessionId,
            status: 'error',
            success: false,
            error: `HTTP ${deleteResponse.status}`
          });
          console.log(`[Delete Puppeteer] ❌ Erro ao deletar: ${session.sessionId}`);
        }

      } catch (error: any) {
        deleteResults.push({
          sessionId: session.sessionId,
          status: 'error',
          success: false,
          error: error.message
        });
        console.error(`[Delete Puppeteer] ❌ Erro: ${session.sessionId}`, error);
      }
    }

    const successCount = deleteResults.filter(r => r.success).length;
    const errorCount = deleteResults.filter(r => !r.success).length;

    console.log(`[Delete Puppeteer] 📊 Resultado: ${successCount} sucessos, ${errorCount} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${successCount} sessions from VPS`,
        totalSessions: sessions.length,
        successCount,
        errorCount,
        results: deleteResults
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Delete Puppeteer] ❌ Erro geral:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// 🧹 Limpar tabela do banco de dados
async function cleanupDatabase(supabase: any) {
  try {
    console.log(`[Delete Puppeteer] 🧹 Limpando tabela instances_puppeteer`);

    const { data, error } = await supabase
      .from('instances_puppeteer')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except impossible ID

    if (error) {
      throw error;
    }

    console.log(`[Delete Puppeteer] ✅ Tabela limpa com sucesso`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database table cleaned successfully',
        deletedRows: data?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Delete Puppeteer] ❌ Erro ao limpar banco:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
} 