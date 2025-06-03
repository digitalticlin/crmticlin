
import ChartCard from "@/components/dashboard/ChartCard";
import { useTagsData } from "@/hooks/dashboard/useTagsData";
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

export default function TagsChart() {
  const { config } = useDashboardConfig();
  const { tagsData, loading } = useTagsData(config.period_filter);

  if (loading) {
    return (
      <ChartCard 
        title="Leads por Etiquetas" 
        description="Distribuição de leads por etiquetas no funil"
      >
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </ChartCard>
    );
  }

  if (tagsData.length === 0) {
    return (
      <ChartCard 
        title="Leads por Etiquetas" 
        description="Distribuição de leads por etiquetas no funil"
      >
        <div className="h-64 flex items-center justify-center text-gray-600">
          <p>Nenhuma etiqueta com dados para o período selecionado</p>
        </div>
      </ChartCard>
    );
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartCard 
      title="Leads por Etiquetas" 
      description="Distribuição de leads por etiquetas no funil"
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={tagsData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {tagsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.9)", 
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                border: "none"
              }} 
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
