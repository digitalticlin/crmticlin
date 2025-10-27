
import KPICard from "./KPICard";

interface KPIGridProps {
  totalLeads: number;
  newLeads: number;
  conversions: number;
  responseRate: number;
}

export function KPIGrid({ totalLeads, newLeads, conversions, responseRate }: KPIGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 pb-8 overflow-visible">
      <KPICard
        title="Total de Leads"
        value={totalLeads.toString()}
        trend={{ value: 12, isPositive: true }}
        icon="users"
      />
      <KPICard
        title="Novos Leads"
        value={newLeads.toString()}
        trend={{ value: 5, isPositive: true }}
        icon="userPlus"
      />
      <KPICard
        title="Conversões"
        value={conversions.toString()}
        trend={{ value: 8, isPositive: true }}
        icon="trendingUp"
      />
      <KPICard
        title="Taxa de Resposta"
        value={`${responseRate}%`}
        trend={{ value: 2, isPositive: false }}
        icon="messageSquare"
      />
    </div>
  );
}
