
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBroadcastCampaigns } from '@/hooks/broadcast/useBroadcastCampaigns';
import { BarChart3, TrendingUp, Send, AlertCircle, Clock, CheckCircle } from 'lucide-react';

export const CampaignStats = () => {
  const { campaigns } = useBroadcastCampaigns();

  // Calcular estatísticas
  const totalCampaigns = campaigns.length;
  const totalRecipients = campaigns.reduce((acc, c) => acc + c.total_recipients, 0);
  const totalSent = campaigns.reduce((acc, c) => acc + c.sent_count, 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + c.failed_count, 0);
  
  const campaignsByStatus = campaigns.reduce((acc, campaign) => {
    acc[campaign.status] = (acc[campaign.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const successRate = totalRecipients > 0 ? ((totalSent / totalRecipients) * 100).toFixed(1) : '0';

  const statsCards = [
    {
      title: 'Total de Campanhas',
      value: totalCampaigns,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Mensagens Enviadas',
      value: totalSent,
      icon: Send,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Taxa de Sucesso',
      value: `${successRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Falhas',
      value: totalFailed,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const statusCards = [
    {
      status: 'draft',
      label: 'Rascunho',
      count: campaignsByStatus.draft || 0,
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      status: 'running',
      label: 'Executando',
      count: campaignsByStatus.running || 0,
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      status: 'completed',
      label: 'Concluídas',
      count: campaignsByStatus.completed || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      status: 'failed',
      label: 'Falharam',
      count: campaignsByStatus.failed || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Estatísticas Gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="flex items-center p-6">
                <div className={`${stat.bgColor} p-3 rounded-lg mr-4`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Campanhas por Status */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Campanhas por Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((item) => (
            <Card key={item.status}>
              <CardContent className="flex items-center p-6">
                <div className={`${item.bgColor} p-3 rounded-lg mr-4`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Campanhas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Campanhas Mais Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-gray-500">
                      {campaign.total_recipients} destinatários • {campaign.sent_count} enviadas
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status === 'completed' ? 'Concluída' :
                       campaign.status === 'running' ? 'Executando' :
                       campaign.status === 'failed' ? 'Falhou' : 'Rascunho'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Nenhuma campanha encontrada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
