
import ChartCard from "@/components/dashboard/ChartCard";
import {
  FunnelChart as RechartsFunnel,
  ResponsiveContainer,
  Tooltip,
  Cell
} from "recharts";

// Mock data - será substituído por dados reais
const funnelData = [
  { name: "Leads Gerados", value: 1000, color: "#d3d800" },
  { name: "Contato Inicial", value: 800, color: "#b8c500" },
  { name: "Qualificados", value: 600, color: "#9db200" },
  { name: "Proposta", value: 400, color: "#829f00" },
  { name: "Negociação", value: 200, color: "#678c00" },
  { name: "Fechados", value: 100, color: "#4c7900" }
];

export default function FunnelChart() {
  return (
    <ChartCard 
      title="Funil de Conversão" 
      description="Análise do funil de vendas por etapa"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <div className="space-y-2">
            {funnelData.map((stage, index) => {
              const percentage = index === 0 ? 100 : Math.round((stage.value / funnelData[0].value) * 100);
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
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
