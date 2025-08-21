
import { SafeDialog, SafeDialogContent, SafeDialogHeader, SafeDialogTitle } from "@/components/ui/safe-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Pause,
  MessageCircle,
  Image,
  Video,
  Mic,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Tag
} from "lucide-react";
import { BroadcastCampaign } from "@/hooks/broadcast/useBroadcastCampaigns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CampaignDetailsProps {
  campaign: BroadcastCampaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CampaignDetails = ({ campaign, open, onOpenChange }: CampaignDetailsProps) => {
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
      running: "Ativa",
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
        return <Image className="w-5 h-5 text-blue-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'audio':
        return <Mic className="w-5 h-5 text-orange-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-green-500" />;
      default:
        return <MessageCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getProgressPercentage = () => {
    if (campaign.total_recipients === 0) return 0;
    return (campaign.sent_count / campaign.total_recipients) * 100;
  };

  return (
    <SafeDialog open={open} onOpenChange={onOpenChange}>
      <SafeDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <SafeDialogHeader>
          <SafeDialogTitle className="flex items-center gap-3">
            {getMediaIcon()}
            {campaign.name}
            {getStatusBadge(campaign.status)}
          </SafeDialogTitle>
        </SafeDialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Criada em:</span>
                <p className="font-medium">
                  {format(new Date(campaign.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Limite por minuto:</span>
                <p className="font-medium">{campaign.rate_limit_per_minute} mensagens/min</p>
              </div>
              <div>
                <span className="text-gray-600">Horário comercial:</span>
                <p className="font-medium">{campaign.business_hours_only ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <span className="text-gray-600">Fuso horário:</span>
                <p className="font-medium">{campaign.timezone}</p>
              </div>
            </div>
          </div>

          {/* Configuração da Mensagem */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Configuração da Mensagem
            </h3>
            
            {campaign.media_type && (
              <div className="mb-3">
                <span className="text-gray-600 text-sm">Tipo de mídia:</span>
                <div className="flex items-center gap-2 mt-1">
                  {getMediaIcon()}
                  <span className="font-medium capitalize">{campaign.media_type}</span>
                </div>
              </div>
            )}

            <div>
              <span className="text-gray-600 text-sm">Texto da mensagem:</span>
              <div className="bg-gray-50 rounded-lg p-3 mt-1 border">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {campaign.message_text || 'Mensagem sem texto'}
                </p>
              </div>
            </div>
          </div>

          {/* Público-Alvo */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Público-Alvo
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Tipo de segmentação:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Tag className="w-4 h-4 text-blue-500" />
                  <span className="font-medium capitalize">{campaign.target_type}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Total de destinatários:</span>
                <p className="font-medium text-lg">{campaign.total_recipients}</p>
              </div>
            </div>
          </div>

          {/* Relatório de Envios */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Relatório de Envios
            </h3>
            
            {/* Progress Bar */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{getProgressPercentage().toFixed(1)}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-green-600">{campaign.sent_count}</p>
                <p className="text-xs text-green-700">Enviadas</p>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-red-600">{campaign.failed_count}</p>
                <p className="text-xs text-red-700">Falhas</p>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-blue-600">
                  {campaign.total_recipients - campaign.sent_count - campaign.failed_count}
                </p>
                <p className="text-xs text-blue-700">Na fila</p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
            {(campaign.status === 'draft' || campaign.status === 'paused') && (
              <Button className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white border-0">
                <Play className="w-4 h-4 mr-2" />
                Iniciar Campanha
              </Button>
            )}
            
            {campaign.status === 'running' && (
              <Button variant="outline" className="bg-white/50 border-white/20">
                <Pause className="w-4 h-4 mr-2" />
                Pausar Campanha
              </Button>
            )}
            
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </SafeDialogContent>
    </SafeDialog>
  );
};
