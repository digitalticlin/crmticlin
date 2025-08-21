
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BroadcastCampaign } from "@/hooks/broadcast/useBroadcastCampaigns";
import { Play, Pause, BarChart3, Users, MessageSquare, Clock, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CampaignExecutionCardProps {
  campaign: BroadcastCampaign;
  onStart: () => void;
  onPause?: () => void;
  onViewDetails?: () => void;
}

export const CampaignExecutionCard = ({ 
  campaign, 
  onStart, 
  onPause, 
  onViewDetails 
}: CampaignExecutionCardProps) => {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Rascunho", variant: "secondary" as const },
      running: { label: "Executando", variant: "default" as const },
      paused: { label: "Pausada", variant: "outline" as const },
      completed: { label: "Concluída", variant: "secondary" as const },
      failed: { label: "Falhou", variant: "destructive" as const },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.draft;
  };

  const getProgress = () => {
    if (!campaign.total_recipients || campaign.total_recipients === 0) return 0;
    return (campaign.sent_count / campaign.total_recipients) * 100;
  };

  const statusBadge = getStatusBadge(campaign.status);
  const progress = getProgress();

  return (
    <ModernCard className="transition-all duration-200 hover:shadow-lg">
      <ModernCardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <ModernCardTitle className="text-lg">{campaign.name}</ModernCardTitle>
            <Badge variant={statusBadge.variant}>
              {statusBadge.label}
            </Badge>
          </div>
          {campaign.status === 'draft' && (
            <Button size="sm" onClick={onStart} className="gap-2">
              <Play className="h-4 w-4" />
              Iniciar
            </Button>
          )}
          {campaign.status === 'running' && onPause && (
            <Button size="sm" variant="outline" onClick={onPause} className="gap-2">
              <Pause className="h-4 w-4" />
              Pausar
            </Button>
          )}
        </div>
      </ModernCardHeader>
      
      <ModernCardContent className="space-y-4">
        {/* Message Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Mensagem:</p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.message_text}
          </p>
        </div>

        {/* Progress Bar */}
        {campaign.status === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{campaign.total_recipients || 0}</p>
              <p className="text-xs text-muted-foreground">Destinatários</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{campaign.sent_count || 0}</p>
              <p className="text-xs text-muted-foreground">Enviadas</p>
            </div>
          </div>
        </div>

        {/* Failed Messages */}
        {campaign.failed_count > 0 && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{campaign.failed_count} falharam</span>
          </div>
        )}

        {/* Schedule Info */}
        {campaign.scheduled_at && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              Agendada para {format(new Date(campaign.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Rate Limit Info */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm">
            {campaign.rate_limit_per_minute} msg/min
            {campaign.business_hours_only && " • Horário comercial"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1 gap-2">
              <BarChart3 className="h-4 w-4" />
              Detalhes
            </Button>
          )}
        </div>
      </ModernCardContent>
    </ModernCard>
  );
};
