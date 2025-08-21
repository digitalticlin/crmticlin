
import { ModernCard, ModernCardContent } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Pause, 
  MoreHorizontal, 
  Users, 
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Image,
  Video,
  Mic,
  FileText
} from "lucide-react";
import { BroadcastCampaign } from "@/hooks/broadcast/useBroadcastCampaigns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ModernCampaignCardProps {
  campaign: BroadcastCampaign;
  onStart: () => void;
}

export function ModernCampaignCard({ campaign, onStart }: ModernCampaignCardProps) {
  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-gray-100 text-gray-800 border-gray-300",
      running: "bg-green-100 text-green-800 border-green-300",
      paused: "bg-yellow-100 text-yellow-800 border-yellow-300",
      completed: "bg-blue-100 text-blue-800 border-blue-300",
      failed: "bg-red-100 text-red-800 border-red-300"
    };

    const labels = {
      draft: "Rascunho",
      running: "Executando",
      paused: "Pausada",
      completed: "Concluída",
      failed: "Falhou"
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || styles.draft}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getMediaIcon = () => {
    switch (campaign.media_type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Mic className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getProgressPercentage = () => {
    if (campaign.total_recipients === 0) return 0;
    return (campaign.sent_count / campaign.total_recipients) * 100;
  };

  const canStart = campaign.status === 'draft' || campaign.status === 'paused';
  const canPause = campaign.status === 'running';

  return (
    <ModernCard className="hover:shadow-xl transition-all duration-200">
      <ModernCardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Informações principais */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {getMediaIcon()}
                {campaign.name}
              </h3>
              {getStatusBadge(campaign.status)}
            </div>

            {/* Preview da mensagem */}
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {campaign.message_text || 'Mensagem sem texto'}
              </p>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">{campaign.total_recipients}</span> destinatários
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">
                  <span className="font-medium text-green-600">{campaign.sent_count}</span> enviadas
                </span>
              </div>
              
              {campaign.failed_count > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">
                    <span className="font-medium text-red-600">{campaign.failed_count}</span> falhas
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {campaign.rate_limit_per_minute}/min
                </span>
              </div>
            </div>

            {/* Progresso */}
            {campaign.status === 'running' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{getProgressPercentage().toFixed(1)}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
            )}

            {/* Data de criação */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              Criada em {format(new Date(campaign.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 md:w-32">
            {canStart && (
              <Button
                onClick={onStart}
                className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white border-0"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </Button>
            )}
            
            {canPause && (
              <Button
                variant="outline"
                size="sm"
                className="bg-white/50 border-white/20"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/20 hover:bg-white/30"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </ModernCardContent>
    </ModernCard>
  );
}
