
import { useEffect, useState } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useFunnelDashboard } from "@/hooks/salesFunnel/useFunnelDashboard";
import { useStageDatabase } from "@/hooks/salesFunnel/useStageDatabase";

export default function FunnelChart() {
  const { companyId } = useCompanyData();
  const { selectedFunnel } = useFunnelManagement(companyId);
  const { report, loading } = useFunnelDashboard(selectedFunnel?.id || "");
  const { stages } = useStageDatabase(selectedFunnel?.id);
  const [funnelData, setFunnelData] = useState<any[]>([]);

  useEffect(() => {
    if (!report || !stages.length) {
      setFunnelData([]);
      return;
    }

    // Criar dados do funil baseado nos estágios e relatório
    const data = stages
      .filter(stage => !stage.is_won && !stage.is_lost) // Excluir ganho/perdido
      .sort((a, b) => a.order_position - b.order_position)
      .map(stage => {
        const stageReport = report.find(r => r.kanban_stage_id === stage.id);
        const count = stageReport?.count || 0;
        
        return {
          name: stage.title,
          value: count,
          color: stage.color || "#d3d800"
        };
      });

    setFunnelData(data);
  }, [report, stages]);

  if (loading) {
    return (
      <ChartCard 
        title="Funil de Conversão" 
        description="Carregando dados do funil..."
      >
        <div className="h-96 flex items-center justify-center">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </ChartCard>
    );
  }

  if (funnelData.length === 0) {
    return (
      <ChartCard 
        title="Funil de Conversão" 
        description="Análise do funil de vendas por etapa"
      >
        <div className="h-96 flex items-center justify-center">
          <p className="text-gray-500">Nenhum dado disponível</p>
        </div>
      </ChartCard>
    );
  }

  const totalLeads = funnelData[0]?.value || 1;

  return (
    <ChartCard 
      title="Funil de Conversão" 
      description={`Análise do funil de vendas - ${selectedFunnel?.name || 'Funil Principal'}`}
    >
      <div className="h-96">
        <div className="space-y-2">
          {funnelData.map((stage, index) => {
            const percentage = index === 0 ? 100 : Math.round((stage.value / totalLeads) * 100);
            const width = `${percentage}%`;
            
            return (
              <div key={stage.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">{stage.name}</span>
                  <span className="text-gray-600">{stage.value} ({percentage}%)</span>
                </div>
                <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="h-full rounded-lg transition-all duration-500"
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
    </ChartCard>
  );
}
