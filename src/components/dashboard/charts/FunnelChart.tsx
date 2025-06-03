
import ChartCard from "@/components/dashboard/ChartCard";
import EmptyStateMessage from "@/components/dashboard/EmptyStateMessage";
import { useFunnelData } from "@/hooks/dashboard/useFunnelData";
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";

export default function FunnelChart() {
  const { config } = useDashboardConfig();
  const { funnelData, loading } = useFunnelData(config.period_filter);

  if (loading) {
    return (
      <ChartCard 
        title="Jornada dos Contatos" 
        description="Acompanhe como seus contatos evoluem no processo de venda"
      >
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </ChartCard>
    );
  }

  if (funnelData.length === 0) {
    return (
      <ChartCard 
        title="Jornada dos Contatos" 
        description="Acompanhe como seus contatos evoluem no processo de venda"
      >
        <div className="h-96">
          <EmptyStateMessage type="funnel" className="h-full" />
        </div>
      </ChartCard>
    );
  }

  const totalLeads = funnelData.reduce((sum, stage) => sum + stage.value, 0);

  return (
    <ChartCard 
      title="Jornada dos Contatos" 
      description="Acompanhe como seus contatos evoluem no processo de venda"
    >
      <div className="h-96">
        <div className="space-y-2">
          {funnelData.map((stage, index) => {
            const percentage = totalLeads > 0 ? Math.round((stage.value / totalLeads) * 100) : 0;
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
