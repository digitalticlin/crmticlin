
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface HealthStatus {
  totalLeads: number;
  leadsWithStage: number;
  leadsWithoutStage: number;
  orphanedLeads: string[];
  isHealthy: boolean;
}

export function LeadStageHealthMonitor({ funnelId }: { funnelId?: string }) {
  const { user } = useAuth();
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    if (!user?.id || !funnelId) return;

    try {
      console.log('[LeadStageHealthMonitor] 🏥 Verificando saúde dos leads...');

      // Buscar todos os leads do funil
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, kanban_stage_id, name')
        .eq('funnel_id', funnelId)
        .eq('created_by_user_id', user.id);

      if (leadsError) throw leadsError;

      const totalLeads = leads?.length || 0;
      const leadsWithStage = leads?.filter(l => l.kanban_stage_id).length || 0;
      const leadsWithoutStage = totalLeads - leadsWithStage;
      const orphanedLeads = leads?.filter(l => !l.kanban_stage_id).map(l => l.id) || [];

      const status: HealthStatus = {
        totalLeads,
        leadsWithStage,
        leadsWithoutStage,
        orphanedLeads,
        isHealthy: leadsWithoutStage === 0
      };

      setHealthStatus(status);
      setLastCheck(new Date());

      console.log('[LeadStageHealthMonitor] 📊 Status de saúde:', status);

    } catch (error) {
      console.error('[LeadStageHealthMonitor] ❌ Erro ao verificar saúde:', error);
      toast.error('Erro ao verificar saúde dos leads');
    }
  };

  const fixOrphanedLeads = async () => {
    if (!user?.id || !funnelId || !healthStatus?.orphanedLeads.length) return;

    setIsFixing(true);
    try {
      console.log('[LeadStageHealthMonitor] 🔧 Corrigindo leads órfãos...');

      // Buscar a primeira etapa do funil
      const { data: firstStage } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('funnel_id', funnelId)
        .eq('title', 'Entrada de Leads')
        .single();

      let stageId = firstStage?.id;

      // Se não encontrar "Entrada de Leads", usar a primeira por posição
      if (!stageId) {
        const { data: stages } = await supabase
          .from('kanban_stages')
          .select('id')
          .eq('funnel_id', funnelId)
          .order('order_position')
          .limit(1);

        stageId = stages?.[0]?.id;
      }

      if (!stageId) {
        throw new Error('Nenhuma etapa encontrada no funil');
      }

      // Atualizar todos os leads órfãos
      const { error: updateError } = await supabase
        .from('leads')
        .update({ kanban_stage_id: stageId })
        .in('id', healthStatus.orphanedLeads);

      if (updateError) throw updateError;

      toast.success(`${healthStatus.orphanedLeads.length} leads órfãos foram corrigidos!`);
      
      // Verificar novamente a saúde
      await checkHealth();

    } catch (error) {
      console.error('[LeadStageHealthMonitor] ❌ Erro ao corrigir leads:', error);
      toast.error('Erro ao corrigir leads órfãos');
    } finally {
      setIsFixing(false);
    }
  };

  useEffect(() => {
    if (funnelId) {
      checkHealth();
    }
  }, [funnelId, user?.id]);

  if (!healthStatus) return null;

  return (
    <div className="space-y-2">
      {!healthStatus.isHealthy && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="text-orange-800">
              <strong>{healthStatus.leadsWithoutStage} leads</strong> sem etapa definida
              <span className="text-sm text-orange-600 block">
                Total: {healthStatus.totalLeads} leads | Com etapa: {healthStatus.leadsWithStage}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={fixOrphanedLeads}
              disabled={isFixing}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              {isFixing ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-3 w-3 mr-1" />
              )}
              Corrigir
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {healthStatus.isHealthy && healthStatus.totalLeads > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Todos os {healthStatus.totalLeads} leads estão com etapas definidas
            {lastCheck && (
              <span className="text-xs text-green-600 block">
                Última verificação: {lastCheck.toLocaleTimeString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={checkHealth}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        <RefreshCw className="h-3 w-3 mr-1" />
        Verificar novamente
      </Button>
    </div>
  );
}
