
import React from 'react';
import { useDashboardConfig } from '@/hooks/dashboard/useDashboardConfig';
import { useDashboardKPIs } from '@/hooks/dashboard/useDashboardKPIs';
import { KPIGrid } from './KPIGrid';
import StatsSection from './StatsSection';
import ChartCard from './ChartCard';

export const DashboardContent = () => {
  const { config } = useDashboardConfig();
  const { data: kpiData } = useDashboardKPIs(config.periodFilter);

  return (
    <div className="space-y-6 p-6">
      {/* KPI Grid */}
      <KPIGrid
        totalLeads={kpiData.total_leads}
        newLeads={kpiData.novos_leads}
        conversions={Math.round(kpiData.taxa_conversao)}
        responseRate={kpiData.tempo_resposta}
      />

      {/* Stats Section */}
      <StatsSection />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Leads por Período"
          description="Evolução dos leads ao longo do tempo"
        >
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Gráfico de leads será implementado aqui
          </div>
        </ChartCard>

        <ChartCard
          title="Taxa de Conversão"
          description="Performance de conversão por período"
        >
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Gráfico de conversão será implementado aqui
          </div>
        </ChartCard>
      </div>
    </div>
  );
};
