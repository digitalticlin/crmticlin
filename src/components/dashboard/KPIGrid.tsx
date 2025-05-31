
import { KPICard } from "./KPICard";
import { WhatsAppTestCard } from "./WhatsAppTestCard";

interface KPIGridProps {
  totalLeads: number;
  newLeads: number;
  conversions: number;
  responseRate: number;
}

export function KPIGrid({ totalLeads, newLeads, conversions, responseRate }: KPIGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <KPICard
        title="Total de Leads"
        value={totalLeads.toString()}
        change="+12%"
        trend="up"
        icon="users"
      />
      <KPICard
        title="Novos Leads"
        value={newLeads.toString()}
        change="+5%"
        trend="up"
        icon="userPlus"
      />
      <KPICard
        title="Conversões"
        value={conversions.toString()}
        change="+8%"
        trend="up"
        icon="trendingUp"
      />
      <KPICard
        title="Taxa de Resposta"
        value={`${responseRate}%`}
        change="-2%"
        trend="down"
        icon="messageSquare"
      />
      
      {/* Card de teste WhatsApp na grade */}
      <div className="md:col-span-2 lg:col-span-1">
        <WhatsAppTestCard />
      </div>
    </div>
  );
}
