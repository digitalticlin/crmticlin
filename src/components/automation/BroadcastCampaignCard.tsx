
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  BarChart3, 
  Clock, 
  Users, 
  MessageSquare,
  Calendar 
} from 'lucide-react';
import { BroadcastCampaign } from '@/hooks/broadcast/useBroadcastCampaigns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BroadcastCampaignCardProps {
  campaign: BroadcastCampaign;
  onStart: (campaignId: string) => void;
  onPause: (campaignId: string) => void;
  onViewDetails: (campaignId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-500';
    case 'running': return 'bg-blue-500';
    case 'paused': return 'bg-yellow-500';
    case 'completed': return 'bg-green-500';
    case 'failed': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'draft': return 'Rascunho';
    case 'running': return 'Executando';
    case 'paused': return 'Pausado';
    case 'completed': return 'Concluído';
    case 'failed': return 'Falhou';
    default: return status;
  }
};

const getTargetTypeText = (type: string) => {
  switch (type) {
    case 'all': return 'Todos os leads';
    case 'funnel': return 'Por funil';
    case 'stage': return 'Por etapa';
    case 'tags': return 'Por tags';
    case 'custom': return 'Personalizado';
    default: return type;
  }
};

export const BroadcastCampaignCard: React.FC<BroadcastCampaignCardProps> = ({
  campaign,
  onStart,
  onPause,
  onViewDetails,
}) => {
  const progress = campaign.total_recipients > 0 
    ? ((campaign.sent_count + campaign.failed_count) / campaign.total_recipients) * 100 
    : 0;

  const canStart = campaign.status === 'draft' || campaign.status === 'paused';
  const canPause = campaign.status === 'running';

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {campaign.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {format(new Date(campaign.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </div>
          </div>
          <Badge className={`${getStatusColor(campaign.status)} text-white`}>
            {getStatusText(campaign.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Message Preview */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Mensagem</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.message_text}
          </p>
        </div>

        {/* Target Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Público:</span>
          <span className="font-medium">{getTargetTypeText(campaign.target_type)}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-lg font-semibold">{campaign.total_recipients}</div>
            <div className="text-xs text-muted-foreground">Destinatários</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-lg font-semibold">{campaign.sent_count}</div>
            <div className="text-xs text-muted-foreground">Enviados</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-lg font-semibold">{campaign.failed_count}</div>
            <div className="text-xs text-muted-foreground">Falharam</div>
          </div>
        </div>

        {/* Progress */}
        {campaign.total_recipients > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {canStart && (
            <Button
              onClick={() => onStart(campaign.id)}
              size="sm"
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              {campaign.status === 'draft' ? 'Iniciar' : 'Retomar'}
            </Button>
          )}
          
          {canPause && (
            <Button
              onClick={() => onPause(campaign.id)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </Button>
          )}
          
          <Button
            onClick={() => onViewDetails(campaign.id)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
