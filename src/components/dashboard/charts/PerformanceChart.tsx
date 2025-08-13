
import ChartCard from "@/components/dashboard/ChartCard";
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { usePerformanceByOwner } from "@/hooks/dashboard/usePerformanceByOwner";
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
  const { data, isLoading } = usePerformanceByOwner(config.period_filter);

  return (
    <ChartCard 
      title="Performance de Vendedores" 
      description="Leads ativos e vendas ganhas por responsável"
    >
      <div className="h-80 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={70}
              tickMargin={8}
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
              dataKey="activeLeads" 
              name="Leads Ativos" 
              fill="#d3d800" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="wonInPeriod" 
              name="Vendas (ganhas no período)" 
              fill="#0088FE" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
