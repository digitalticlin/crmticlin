
import KPICard from "@/components/dashboard/KPICard";
import { Users, MessageSquare, Zap, TrendingUp } from "lucide-react";

export default function KPIGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KPICard
        title="Leads Novos"
        value="185"
        trend={{ value: 12, isPositive: true }}
        icon={<Users className="h-5 w-5" />}
      />
      <KPICard
        title="Atendimentos"
        value="1,234"
        trend={{ value: 8, isPositive: true }}
        icon={<MessageSquare className="h-5 w-5" />}
        variant="primary"
      />
      <KPICard
        title="Leads Ganhos"
        value="72"
        trend={{ value: 5, isPositive: true }}
        icon={<Zap className="h-5 w-5" />}
        variant="highlight"
      />
      <KPICard
        title="Taxa de Conversão"
        value="38.9%"
        trend={{ value: 2, isPositive: false }}
        icon={<TrendingUp className="h-5 w-5" />}
      />
    </div>
  );
}
