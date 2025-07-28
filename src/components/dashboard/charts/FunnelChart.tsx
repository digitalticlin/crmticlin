
import { useEffect, useState, useMemo, useCallback } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useSalesFunnelDirect } from "@/hooks/salesFunnel/useSalesFunnelDirect";
import { useFunnelDashboard } from "@/hooks/salesFunnel/useFunnelDashboard";
import { useStageDatabase } from "@/hooks/salesFunnel/useStageDatabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface FunnelChartProps {
  className?: string;
}

interface FunnelDataItem {
  name: string;
  value: number;
  color: string;
}

export default function FunnelChart({ className }: FunnelChartProps) {
  const { companyId } = useCompanyData();
  const { selectedFunnel } = useSalesFunnelDirect();
  const { report, loading } = useFunnelDashboard(selectedFunnel?.id || "");
  const { stages } = useStageDatabase(selectedFunnel?.id);
  const [funnelData, setFunnelData] = useState<FunnelDataItem[]>([]);

  // ✅ CORREÇÃO: Memoizar dados estáveis para evitar loops
  const memoizedReport = useMemo(() => {
    if (!report || !Array.isArray(report)) return [];
    return report.map(item => ({
      kanban_stage_id: item.kanban_stage_id,
      count: item.count || 0
    }));
  }, [report]);

  const memoizedStages = useMemo(() => {
    if (!stages || !Array.isArray(stages)) return [];
    return stages
      .filter(stage => !stage.is_won && !stage.is_lost)
      .sort((a, b) => a.order_position - b.order_position)
      .map(stage => ({
        id: stage.id,
        title: stage.title,
        color: stage.color || "#d3d800",
        order_position: stage.order_position
      }));
  }, [stages]);

  // ✅ CORREÇÃO: Função de processamento estável
  const processData = useCallback((reportData: typeof memoizedReport, stageData: typeof memoizedStages) => {
    if (!reportData.length || !stageData.length) {
      return [];
    }

    return stageData.map(stage => {
      const stageReport = reportData.find(r => r.kanban_stage_id === stage.id);
      const count = stageReport?.count || 0;
      
      return {
        name: stage.title,
        value: count,
        color: stage.color
      };
    });
  }, []);

  // ✅ CORREÇÃO: useEffect com dependências estáveis e verificação de igualdade
  useEffect(() => {
    if (!memoizedReport || !memoizedStages) {
      return;
    }

    const newData = processData(memoizedReport, memoizedStages);
    
    // ✅ VERIFICAÇÃO: Só atualizar se os dados realmente mudaram
    setFunnelData(currentData => {
      const dataChanged = JSON.stringify(currentData) !== JSON.stringify(newData);
      if (!dataChanged) {
        return currentData;
      }
      return newData;
    });
  }, [memoizedReport, memoizedStages, processData]);

  // ✅ CORREÇÃO: Memoizar valores computados
  const totalLeads = useMemo(() => {
    return funnelData.length > 0 ? funnelData[0]?.value || 1 : 1;
  }, [funnelData]);

  const renderContent = useMemo(() => {
    if (loading) {
      return (
        <div className="h-96 flex items-center justify-center">
          <p className="text-gray-500">Carregando...</p>
        </div>
      );
    }

    if (funnelData.length === 0) {
      return (
        <div className="h-96 flex items-center justify-center">
          <p className="text-gray-500">Nenhum dado disponível</p>
        </div>
      );
    }

    return (
      <div className="h-96">
        <div className="space-y-2">
          {funnelData.map((stage, index) => {
            const percentage = index === 0 ? 100 : Math.round((stage.value / totalLeads) * 100);
            const width = `${percentage}%`;
            
            return (
              <div key={`${stage.name}-${index}`} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">{stage.name}</span>
                  <span className="text-gray-600">{stage.value} ({percentage}%)</span>
                </div>
                <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="h-full rounded-lg transition-all duration-300"
                    style={{ 
                      width, 
                      backgroundColor: stage.color,
                      background: `linear-gradient(90deg, ${stage.color}, ${stage.color}dd)`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [loading, funnelData, totalLeads]);

  return (
    <ChartCard 
      title="Funil de Conversão" 
      description={`Análise do funil de vendas - ${selectedFunnel?.name || 'Funil Principal'}`}
    >
      {renderContent}
    </ChartCard>
  );
}
