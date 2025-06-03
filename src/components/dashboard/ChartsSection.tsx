
import ChartCard from "@/components/dashboard/ChartCard";
import { useTemporalData } from "@/hooks/dashboard/useTemporalData";
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";

export default function ChartsSection() {
  const { config } = useDashboardConfig();
  const { temporalData, loading } = useTemporalData(config.period_filter);

  if (loading) {
    return (
      <ChartCard 
        title="Evolução Temporal" 
        description="Leads recebidos vs. convertidos ao longo do tempo"
      >
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </ChartCard>
    );
  }

  if (temporalData.length === 0) {
    return (
      <ChartCard 
        title="Evolução Temporal" 
        description="Leads recebidos vs. convertidos ao longo do tempo"
      >
        <div className="h-80 flex items-center justify-center text-gray-600">
          <p>Nenhum dado temporal disponível para o período selecionado</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard 
      title="Evolução Temporal" 
      description="Leads recebidos vs. convertidos ao longo do tempo"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={temporalData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d3d800" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#d3d800" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.8)", 
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                border: "none"
              }} 
            />
            <Area
              type="monotone"
              dataKey="leads"
              name="Leads Recebidos"
              stroke="#d3d800"
              fillOpacity={1}
              fill="url(#colorLeads)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="converted"
              name="Leads Convertidos"
              stroke="#0088FE"
              fillOpacity={1}
              fill="url(#colorConverted)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
