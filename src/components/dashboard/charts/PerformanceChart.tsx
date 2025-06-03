
import ChartCard from "@/components/dashboard/ChartCard";
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

// Mock data - será substituído por dados reais
const performanceData = [
  { name: "João Silva", leads: 45, conversoes: 12, vendas: 25000 },
  { name: "Maria Santos", leads: 38, conversoes: 15, vendas: 32000 },
  { name: "Pedro Costa", leads: 52, conversoes: 8, vendas: 18000 },
  { name: "Ana Oliveira", leads: 41, conversoes: 18, vendas: 38000 },
  { name: "Carlos Lima", leads: 29, conversoes: 9, vendas: 21000 }
];

export default function PerformanceChart() {
  return (
    <ChartCard 
      title="Performance de Vendedores" 
      description="Análise de performance individual por vendedor"
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
              name="Leads" 
              fill="#d3d800" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="conversoes" 
              name="Conversões" 
              fill="#0088FE" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
