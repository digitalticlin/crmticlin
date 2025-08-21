
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Eye, 
  MessageCircle,
  Image,
  Video,
  Mic,
  FileText
} from "lucide-react";
import { BroadcastCampaign } from "@/hooks/broadcast/useBroadcastCampaigns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CampaignTableRowProps {
  campaign: BroadcastCampaign;
  onSelectCampaign: (campaign: BroadcastCampaign) => void;
  onStartCampaign: (campaignId: string) => void;
}

export const CampaignTableRow = ({ 
  campaign, 
  onSelectCampaign, 
  onStartCampaign 
}: CampaignTableRowProps) => {
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
        return <Image className="w-4 h-4 text-blue-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-500" />;
      case 'audio':
        return <Mic className="w-4 h-4 text-orange-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-green-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getProgressPercentage = () => {
    if (campaign.total_recipients === 0) return 0;
    return (campaign.sent_count / campaign.total_recipients) * 100;
  };

  const canStart = campaign.status === 'draft' || campaign.status === 'paused';

  return (
    <TableRow 
      className="border-b border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
      onClick={() => onSelectCampaign(campaign)}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          {getMediaIcon()}
          <div>
            <p className="font-semibold text-gray-900">{campaign.name}</p>
            <p className="text-sm text-gray-600 truncate max-w-[200px]">
              {campaign.message_text || 'Mensagem sem texto'}
            </p>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        {getStatusBadge(campaign.status)}
      </TableCell>
      
      <TableCell>
        <div className="text-sm">
          <span className="font-medium">{campaign.total_recipients}</span> destinatários
        </div>
      </TableCell>
      
      <TableCell>
        <div className="space-y-1 min-w-[120px]">
          <div className="flex justify-between text-sm">
            <span>{campaign.sent_count}</span>
            <span>{campaign.total_recipients}</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
          {campaign.failed_count > 0 && (
            <p className="text-xs text-red-600">
              {campaign.failed_count} falhas
            </p>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm text-gray-600">
          {format(new Date(campaign.created_at), "dd/MM/yyyy", { locale: ptBR })}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-2">
          {canStart && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStartCampaign(campaign.id);
              }}
              className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white border-0"
            >
              <Play className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onSelectCampaign(campaign);
            }}
            className="bg-white/20 hover:bg-white/30"
          >
            <Eye className="w-3 h-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
