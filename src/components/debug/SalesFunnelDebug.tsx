import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function SalesFunnelDebug() {
  const { user } = useAuth();
  const [debugData, setDebugData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDeepAnalysis = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    const results: any = {};

    try {
      // 1. Verificar usuário atual
      results.currentUser = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
        isAdmin: user.user_metadata?.role === 'admin' || user.email === 'inacio@ticlin.com.br'
      };

      // 2. Verificar todos os funis do usuário
      const { data: funnels, error: funnelsError } = await supabase
        .from('funnels')
        .select('*')
        .eq('created_by_user_id', user.id);
      
      results.funnels = {
        data: funnels,
        error: funnelsError,
        count: funnels?.length || 0
      };

      // 3. Verificar TODOS os leads do usuário (sem filtro de funnel)
      const { data: allLeads, error: allLeadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      results.allLeads = {
        data: allLeads,
        error: allLeadsError,
        count: allLeads?.length || 0
      };

      // 4. Verificar leads com filtro de conversation_status
      const { data: activeLeads, error: activeLeadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('created_by_user_id', user.id)
        .in('conversation_status', ['active', 'closed']);

      results.activeLeads = {
        data: activeLeads,
        error: activeLeadsError,
        count: activeLeads?.length || 0
      };

      // 5. Se existir funil, verificar leads por funil
      if (funnels && funnels.length > 0) {
        const firstFunnel = funnels[0];
        
        const { data: funnelLeads, error: funnelLeadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('funnel_id', firstFunnel.id)
          .eq('created_by_user_id', user.id);

        results.funnelLeads = {
          funnelId: firstFunnel.id,
          funnelName: firstFunnel.name,
          data: funnelLeads,
          error: funnelLeadsError,
          count: funnelLeads?.length || 0
        };

        // 6. Verificar stages do funil
        const { data: stages, error: stagesError } = await supabase
          .from('kanban_stages')
          .select('*')
          .eq('funnel_id', firstFunnel.id);

        results.stages = {
          data: stages,
          error: stagesError,
          count: stages?.length || 0
        };
      }

      // 7. Verificar leads sem funnel_id (orphaned)
      const { data: orphanLeads, error: orphanError } = await supabase
        .from('leads')
        .select('*')
        .eq('created_by_user_id', user.id)
        .is('funnel_id', null);

      results.orphanLeads = {
        data: orphanLeads,
        error: orphanError,
        count: orphanLeads?.length || 0
      };

      // 8. Verificar conversation_status únicos
      const { data: statusData } = await supabase
        .from('leads')
        .select('conversation_status')
        .eq('created_by_user_id', user.id);

      const statuses = [...new Set(statusData?.map(l => l.conversation_status))];
      results.conversationStatuses = statuses;

      // 9. Sample de alguns leads para análise
      if (allLeads && allLeads.length > 0) {
        results.sampleLeads = allLeads.slice(0, 3).map(lead => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          funnel_id: lead.funnel_id,
          kanban_stage_id: lead.kanban_stage_id,
          conversation_status: lead.conversation_status,
          created_by_user_id: lead.created_by_user_id,
          owner_id: lead.owner_id,
          created_at: lead.created_at
        }));
      }

      setDebugData(results);
    } catch (error) {
      console.error('Erro na análise:', error);
      results.error = error;
      setDebugData(results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      runDeepAnalysis();
    }
  }, [user?.id]);

  if (!user) return <div>Usuário não logado</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">🔍 Sales Funnel Deep Debug</h1>
          <button 
            onClick={runDeepAnalysis}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analisando...' : '🔄 Executar Análise'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usuário Atual */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-3">👤 Usuário Atual</h3>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(debugData.currentUser, null, 2)}
            </pre>
          </div>

          {/* Funis */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-3">📋 Funis ({debugData.funnels?.count || 0})</h3>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(debugData.funnels, null, 2)}
            </pre>
          </div>

          {/* Todos os Leads */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-3">📊 Todos os Leads ({debugData.allLeads?.count || 0})</h3>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {debugData.allLeads?.error ? JSON.stringify(debugData.allLeads.error, null, 2) : 
               `Total: ${debugData.allLeads?.count || 0} leads`}
            </pre>
          </div>

          {/* Leads Ativos */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-3">✅ Leads Ativos ({debugData.activeLeads?.count || 0})</h3>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {debugData.activeLeads?.error ? JSON.stringify(debugData.activeLeads.error, null, 2) : 
               `Total: ${debugData.activeLeads?.count || 0} leads`}
            </pre>
          </div>

          {/* Leads do Funil */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-3">🎯 Leads do Funil ({debugData.funnelLeads?.count || 0})</h3>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(debugData.funnelLeads, null, 2)}
            </pre>
          </div>

          {/* Stages */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-3">📋 Etapas ({debugData.stages?.count || 0})</h3>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(debugData.stages, null, 2)}
            </pre>
          </div>

          {/* Leads Órfãos */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-3">🚫 Leads Sem Funil ({debugData.orphanLeads?.count || 0})</h3>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {debugData.orphanLeads?.error ? JSON.stringify(debugData.orphanLeads.error, null, 2) : 
               `Total: ${debugData.orphanLeads?.count || 0} leads órfãos`}
            </pre>
          </div>

          {/* Status de Conversa */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-3">💬 Status de Conversa</h3>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(debugData.conversationStatuses, null, 2)}
            </pre>
          </div>

          {/* Sample de Leads */}
          <div className="bg-white p-4 rounded-lg shadow col-span-full">
            <h3 className="font-semibold text-lg mb-3">🔍 Amostra de Leads (Primeiros 3)</h3>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(debugData.sampleLeads, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}