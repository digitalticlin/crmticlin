
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Users, MessageCircle, Clock, Image, Video, Mic, FileText } from "lucide-react";
import { toast } from "sonner";

const SIMULATION_CAMPAIGNS = [
  {
    id: 'sim-1',
    name: 'Teste - Promoção Semanal',
    message: 'Olá! Temos uma promoção especial esta semana com 30% de desconto em todos os produtos. Aproveite!',
    mediaType: 'text' as const,
    fragments: 1,
    targetCount: 150,
    instanceName: 'WhatsApp Principal'
  },
  {
    id: 'sim-2',
    name: 'Teste - Apresentação com Vídeo',
    message: 'Confira nosso novo produto no vídeo em anexo. Esperamos seu feedback!',
    mediaType: 'video' as const,
    fragments: 2,
    targetCount: 85,
    instanceName: 'WhatsApp Vendas'
  },
  {
    id: 'sim-3',
    name: 'Teste - Áudio Promocional',
    message: 'Ouça nossa mensagem especial sobre as novidades!',
    mediaType: 'audio' as const,
    fragments: 1,
    targetCount: 200,
    instanceName: 'WhatsApp Marketing'
  }
];

export function ModernCampaignSimulation() {
  const handleSimulate = (campaign: typeof SIMULATION_CAMPAIGNS[0]) => {
    toast.success(`Simulação iniciada para "${campaign.name}"`, {
      description: `${campaign.targetCount} destinatários simulados com ${campaign.fragments} fragmento(s)`
    });
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <ModernCard className="bg-gradient-to-r from-purple-50/80 to-pink-50/80 backdrop-blur-sm border-purple-200/50">
        <ModernCardContent className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-purple-900 mb-2">
              Simulação de Campanhas
            </h2>
            <p className="text-purple-700">
              Teste suas configurações sem enviar mensagens reais
            </p>
          </div>
        </ModernCardContent>
      </ModernCard>

      {/* Campanhas de simulação */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SIMULATION_CAMPAIGNS.map((campaign) => (
          <ModernCard key={campaign.id} className="hover:shadow-xl transition-all duration-200">
            <ModernCardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <ModernCardTitle className="text-lg font-medium flex items-center gap-2">
                  {getMediaIcon(campaign.mediaType)}
                  <span className="truncate">{campaign.name}</span>
                </ModernCardTitle>
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 shrink-0">
                  Teste
                </Badge>
              </div>
            </ModernCardHeader>
            
            <ModernCardContent className="space-y-4">
              {/* Preview da mensagem */}
              <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm border border-gray-200/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  {getMediaIcon(campaign.mediaType)}
                  <span className="text-sm font-medium capitalize">{campaign.mediaType}</span>
                  {campaign.fragments > 1 && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {campaign.fragments} partes
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{campaign.message}</p>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Destinatários</span>
                  </div>
                  <p className="font-semibold text-blue-600">{campaign.targetCount}</p>
                </div>
                
                <div className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Tempo</span>
                  </div>
                  <p className="font-semibold text-green-600">Imediato</p>
                </div>
              </div>

              {/* Instância */}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">{campaign.instanceName}</span>
              </div>

              {/* Ação */}
              <Button 
                onClick={() => handleSimulate(campaign)} 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
              >
                <Play className="w-4 h-4 mr-2" />
                Simular Disparo
              </Button>
            </ModernCardContent>
          </ModernCard>
        ))}
      </div>

      {/* Informações sobre simulação */}
      <ModernCard className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 backdrop-blur-sm border-blue-200/50">
        <ModernCardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Como funciona a simulação?
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• As mensagens não são enviadas de fato</li>
                <li>• Você pode testar configurações e filtros</li>
                <li>• Ideal para validar campanhas antes do envio real</li>
                <li>• Todas as métricas são simuladas</li>
              </ul>
            </div>
          </div>
        </ModernCardContent>
      </ModernCard>
    </div>
  );
}
