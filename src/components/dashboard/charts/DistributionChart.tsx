
import ChartCard from "@/components/dashboard/ChartCard";
import { useSourceData } from "@/hooks/dashboard/useSourceData";
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";

export default function DistributionChart() {
  const { config } = useDashboardConfig();
  const { sourceData, loading } = useSourceData(config.period_filter);

  if (loading) {
    return (
      <ChartCard 
        title="Distribuição por Fonte" 
        description="Origem dos leads recebidos"
      >
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </ChartCard>
    );
  }

  if (sourceData.length === 0) {
    return (
      <ChartCard 
        title="Distribuição por Fonte" 
        description="Origem dos leads recebidos"
      >
        <div className="h-80 flex items-center justify-center text-gray-600">
          <p>Nenhum dado de fonte disponível para o período selecionado</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard 
      title="Distribuição por Fonte" 
      description="Origem dos leads recebidos"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sourceData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {sourceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip 
              formatter={(value: number) => [`${value}%`, 'Porcentagem']}
              contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.9)", 
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                border: "none"
              }} 
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-gray-700 font-medium">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
