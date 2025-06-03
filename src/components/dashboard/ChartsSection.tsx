
import ChartCard from "@/components/dashboard/ChartCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";

const areaData = [
  { name: "Jan", leads: 400, converted: 240 },
  { name: "Fev", leads: 300, converted: 139 },
  { name: "Mar", leads: 200, converted: 980 },
  { name: "Abr", leads: 278, converted: 390 },
  { name: "Mai", leads: 189, converted: 480 },
  { name: "Jun", leads: 239, converted: 380 },
  { name: "Jul", leads: 349, converted: 430 },
];

export default function ChartsSection() {
  return (
    <ChartCard 
      title="Visão Geral de Leads" 
      description="Leads recebidos vs. convertidos nos últimos 6 meses"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={areaData}
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
