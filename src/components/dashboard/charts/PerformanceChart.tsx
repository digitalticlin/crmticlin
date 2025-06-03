
import ChartCard from "@/components/dashboard/ChartCard";
import EmptyStateMessage from "@/components/dashboard/EmptyStateMessage";
import { usePerformanceData } from "@/hooks/dashboard/usePerformanceData";
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function PerformanceChart() {
  const { config } = useDashboardConfig();
  const { performanceData, loading } = usePerformanceData(config.period_filter);

  if (loading) {
    return (
      <ChartCard 
        title="Desempenho da Equipe" 
        description="Veja como cada membro da equipe está se saindo"
      >
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </ChartCard>
    );
  }

  if (performanceData.length === 0) {
    return (
      <ChartCard 
        title="Desempenho da Equipe" 
        description="Veja como cada membro da equipe está se saindo"
      >
        <div className="h-80">
          <EmptyStateMessage type="performance" className="h-full" />
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard 
      title="Desempenho da Equipe" 
      description="Veja como cada membro da equipe está se saindo"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={performanceData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              fontSize={12}
            />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.9)", 
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                border: "none"
              }} 
            />
            <Legend />
            <Bar 
              dataKey="leads" 
              name="Contatos" 
              fill="#d3d800" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="conversoes" 
              name="Vendas" 
              fill="#0088FE" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
