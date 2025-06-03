
import ChartCard from "@/components/dashboard/ChartCard";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";

const distributionData = [
  { name: "WhatsApp", value: 45, color: "#25D366" },
  { name: "Site", value: 25, color: "#d3d800" },
  { name: "Indicação", value: 20, color: "#0088FE" },
  { name: "Outros", value: 10, color: "#FF8042" }
];

export default function DistributionChart() {
  return (
    <ChartCard 
      title="Distribuição por Fonte" 
      description="Origem dos leads recebidos"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={distributionData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {distributionData.map((entry, index) => (
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
