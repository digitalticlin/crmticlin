
import { useState } from "react";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useBroadcastCampaigns } from "@/hooks/broadcast/useBroadcastCampaigns";
import { BarChart3, TrendingUp, Download, Calendar, Filter } from "lucide-react";

export const CampaignsReports = () => {
  const { campaigns } = useBroadcastCampaigns();
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedCampaign, setSelectedCampaign] = useState("all");

  const getStats = () => {
    const filteredCampaigns = selectedCampaign === "all" 
      ? campaigns 
      : campaigns.filter(c => c.id === selectedCampaign);

    return {
      totalCampaigns: filteredCampaigns.length,
      totalMessages: filteredCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0),
      totalRecipients: filteredCampaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0),
      failureRate: filteredCampaigns.length > 0 
        ? (filteredCampaigns.reduce((sum, c) => sum + (c.failed_count || 0), 0) / 
           filteredCampaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0) * 100).toFixed(2)
        : 0
    };
  };

  const stats = getStats();

  const exportData = () => {
    // Implementation for data export
    console.log('Exporting campaign data...');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Relatório
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="1y">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as campanhas</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={exportData} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </ModernCardContent>
      </ModernCard>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ModernCard>
          <ModernCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Campanhas</p>
                <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </ModernCardContent>
        </ModernCard>

        <ModernCard>
          <ModernCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mensagens Enviadas</p>
                <p className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </ModernCardContent>
        </ModernCard>

        <ModernCard>
          <ModernCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Destinatários</p>
                <p className="text-2xl font-bold">{stats.totalRecipients.toLocaleString()}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </ModernCardContent>
        </ModernCard>

        <ModernCard>
          <ModernCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Falha</p>
                <p className="text-2xl font-bold">{stats.failureRate}%</p>
              </div>
              <Badge variant={Number(stats.failureRate) < 5 ? "secondary" : "destructive"}>
                {Number(stats.failureRate) < 5 ? "Boa" : "Alta"}
              </Badge>
            </div>
          </ModernCardContent>
        </ModernCard>
      </div>

      {/* Detailed Reports */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle>Relatório Detalhado por Campanha</ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent>
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum dado disponível</h3>
                <p className="text-muted-foreground">
                  Crie e execute campanhas para visualizar relatórios detalhados
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Campanha</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Destinatários</th>
                      <th className="text-left p-2">Enviadas</th>
                      <th className="text-left p-2">Falharam</th>
                      <th className="text-left p-2">Taxa Sucesso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => {
                      const successRate = campaign.total_recipients > 0 
                        ? ((campaign.sent_count / campaign.total_recipients) * 100).toFixed(1)
                        : '0';
                      
                      return (
                        <tr key={campaign.id} className="border-b">
                          <td className="p-2 font-medium">{campaign.name}</td>
                          <td className="p-2">
                            <Badge variant="outline">{campaign.status}</Badge>
                          </td>
                          <td className="p-2">{campaign.total_recipients || 0}</td>
                          <td className="p-2">{campaign.sent_count || 0}</td>
                          <td className="p-2">{campaign.failed_count || 0}</td>
                          <td className="p-2">{successRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ModernCardContent>
      </ModernCard>
    </div>
  );
};
