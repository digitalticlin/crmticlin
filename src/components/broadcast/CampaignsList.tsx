
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBroadcastCampaigns } from '@/hooks/broadcast/useBroadcastCampaigns';
import { Play, Pause, Eye, Trash2, Calendar, Users, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const CampaignsList = () => {
  const { campaigns, loading, startCampaign } = useBroadcastCampaigns();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      running: { label: 'Executando', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      paused: { label: 'Pausado', variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Concluído', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      failed: { label: 'Falhou', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  };

  const handleStartCampaign = async (campaignId: string) => {
    const success = await startCampaign(campaignId);
    if (success) {
      toast.success('Campanha iniciada com sucesso!');
    }
  };

  const getTargetTypeLabel = (targetType: string) => {
    const labels = {
      all: 'Todos os Leads',
      funnel: 'Por Funil',
      stage: 'Por Etapa',
      tags: 'Por Tags',
      custom: 'Lista Personalizada'
    };
    return labels[targetType as keyof typeof labels] || targetType;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma campanha criada ainda
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            Crie sua primeira campanha de disparos em massa para começar a enviar mensagens para seus leads.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => {
        const statusConfig = getStatusBadge(campaign.status);
        const progressPercent = campaign.total_recipients > 0 
          ? Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_recipients) * 100)
          : 0;
        
        return (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{campaign.name}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(campaign.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {getTargetTypeLabel(campaign.target_type)}
                    </span>
                  </div>
                </div>
                <Badge className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Mensagem Preview */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {campaign.message_text}
                </p>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-lg text-blue-600">
                    {campaign.total_recipients}
                  </div>
                  <div className="text-gray-500">Destinatários</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-green-600">
                    {campaign.sent_count}
                  </div>
                  <div className="text-gray-500">Enviadas</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-red-600">
                    {campaign.failed_count}
                  </div>
                  <div className="text-gray-500">Falharam</div>
                </div>
              </div>

              {/* Progress Bar */}
              {campaign.status === 'running' && campaign.total_recipients > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Configurações */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>📊 {campaign.rate_limit_per_minute} msgs/min</span>
                {campaign.business_hours_only && <span>⏰ Horário comercial</span>}
                {campaign.scheduled_at && (
                  <span>📅 Agendado para {new Date(campaign.scheduled_at).toLocaleString('pt-BR')}</span>
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  {campaign.status === 'draft' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleStartCampaign(campaign.id)}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Iniciar
                    </Button>
                  )}
                  
                  {campaign.status === 'running' && (
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Pause className="h-4 w-4" />
                      Pausar
                    </Button>
                  )}
                  
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Detalhes
                  </Button>
                </div>
                
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
