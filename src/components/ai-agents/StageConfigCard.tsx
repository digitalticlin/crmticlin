import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, BellOff, Phone } from "lucide-react";

interface FunnelStage {
  id: string;
  title: string;
  color: string;
  order_position: number;
  ai_stage_description: string;
  ai_notify_enabled: boolean;
  notify_phone: string;
  funnel_id: string;
}

interface StageConfigCardProps {
  stage: FunnelStage;
  stageNumber: number;
  onConfigure: () => void;
  onNotificationToggle: (enabled: boolean) => void;
}

export const StageConfigCard = ({
  stage,
  stageNumber,
  onConfigure,
  onNotificationToggle
}: StageConfigCardProps) => {
  
  const getStageEmoji = (position: number) => {
    const emojis = ['🎯', '👀', '📋', '💬', '🤝', '✅', '🏆', '🎉'];
    return emojis[position - 1] || '📌';
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    // Formato: +55 11 99999-9999
    if (phone.length >= 13) {
      return phone.replace(/(\+\d{2})(\d{2})(\d{5})(\d{4})/, '$1 $2 $3-$4');
    }
    return phone;
  };

  const hasDescription = stage.ai_stage_description && stage.ai_stage_description.trim().length > 0;
  const hasPhone = stage.notify_phone && stage.notify_phone.trim().length > 0;

  return (
    <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl transition-all duration-300 hover:bg-white/50 hover:shadow-glass-lg">
      <CardContent className="p-4">
        <div className="space-y-4">
          
          {/* Header do estágio */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: stage.color || '#e0e0e0' }}
              >
                {stageNumber}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  {getStageEmoji(stageNumber)} {stage.title}
                </h3>
                <p className="text-xs text-gray-500">Posição: {stage.order_position}</p>
              </div>
            </div>
            
            <Badge 
              variant={hasDescription ? "default" : "secondary"}
              className={hasDescription 
                ? "bg-green-100 text-green-800 border-green-300" 
                : "bg-gray-100 text-gray-600 border-gray-300"
              }
            >
              {hasDescription ? 'Configurado' : 'Pendente'}
            </Badge>
          </div>

          {/* Descrição IA */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">📝 Descrição para IA:</span>
            </div>
            <div className="bg-white/30 rounded-lg p-3 min-h-[3rem] flex items-center">
              {hasDescription ? (
                <p className="text-sm text-gray-700 line-clamp-2">
                  {stage.ai_stage_description.length > 100 
                    ? `${stage.ai_stage_description.substring(0, 100)}...`
                    : stage.ai_stage_description
                  }
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Clique em "Configurar" para definir como a IA identifica este estágio
                </p>
              )}
            </div>
          </div>

          {/* Notificação WhatsApp */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">🔔 Notificação WhatsApp:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNotificationToggle(!stage.ai_notify_enabled)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    stage.ai_notify_enabled
                      ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {stage.ai_notify_enabled ? (
                    <>
                      <Bell className="h-3 w-3" />
                      ATIVO
                    </>
                  ) : (
                    <>
                      <BellOff className="h-3 w-3" />
                      INATIVO
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Telefone (se notificação ativa) */}
            {stage.ai_notify_enabled && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  {hasPhone 
                    ? formatPhone(stage.notify_phone)
                    : 'Telefone não configurado'
                  }
                </span>
                {!hasPhone && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300 ml-2">
                    Configure o telefone
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Botão configurar */}
          <div className="pt-2 border-t border-white/30">
            <Button
              onClick={onConfigure}
              variant="outline"
              className="w-full bg-yellow-100 border-yellow-300 hover:bg-yellow-200 text-yellow-800 font-medium"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar Estágio
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};