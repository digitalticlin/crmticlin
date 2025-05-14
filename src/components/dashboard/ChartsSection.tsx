
import ChartCard from "@/components/dashboard/ChartCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
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

const barData = [
  { name: "Seg", whatsapp: 20, calls: 10, email: 5 },
  { name: "Ter", whatsapp: 30, calls: 15, email: 7 },
  { name: "Qua", whatsapp: 35, calls: 12, email: 10 },
  { name: "Qui", whatsapp: 40, calls: 18, email: 8 },
  { name: "Sex", whatsapp: 28, calls: 14, email: 9 }
];

export default function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <ChartCard 
        title="Visão Geral de Leads" 
        description="Leads recebidos vs. convertidos nos últimos 6 meses"
        className="lg:col-span-2"
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

      <ChartCard 
        title="Atendimentos por Canal" 
        description="Últimos 5 dias"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
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
              <Legend />
              <Bar dataKey="whatsapp" name="WhatsApp" fill="#25D366" radius={[4, 4, 0, 0]} />
              <Bar dataKey="calls" name="Ligações" fill="#0088FE" radius={[4, 4, 0, 0]} />
              <Bar dataKey="email" name="E-mail" fill="#d3d800" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
