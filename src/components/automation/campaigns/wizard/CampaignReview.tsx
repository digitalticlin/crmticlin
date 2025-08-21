
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { CheckCircle, MessageSquare, Users, Clock, Calendar, Settings, Tag } from "lucide-react";

interface CampaignReviewProps {
  data: any;
  onValidChange: (valid: boolean) => void;
}

const DAYS_LABELS = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça', 
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

export const CampaignReview = ({ data, onValidChange }: CampaignReviewProps) => {
  useEffect(() => {
    // All previous steps must be completed to reach here
    onValidChange(true);
  }, [onValidChange]);

  const formatSchedule = () => {
    if (data.schedule_type === 'immediate') {
      return 'Envio Imediato';
    }
    
    if (data.scheduled_at) {
      const date = new Date(data.scheduled_at);
      return `Agendado para ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return 'Não configurado';
  };

  const formatBusinessHours = () => {
    if (!data.business_hours_only) {
      return 'Sem restrição de horário';
    }

    const days = data.time_range?.days || [];
    const dayLabels = days.map((d: number) => DAYS_LABELS[d as keyof typeof DAYS_LABELS]).join(', ');
    const timeRange = `${data.time_range?.start || '08:00'} às ${data.time_range?.end || '18:00'}`;
    
    return `${dayLabels} das ${timeRange}`;
  };

  const messagePreview = data.message_fragments?.length > 0 
    ? data.message_fragments 
    : [data.message_text];

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-green-600">
          <CheckCircle className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Campanha Pronta para Criação</h2>
        </div>
        <p className="text-muted-foreground">
          Revise as informações abaixo e confirme para criar sua campanha
        </p>
      </div>

      {/* Campaign Details */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Detalhes da Campanha
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="font-medium">{data.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Mídia</p>
              <Badge variant="outline">{data.media_type}</Badge>
            </div>
          </div>
        </ModernCardContent>
      </ModernCard>

      {/* Message Preview */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Preview da Mensagem
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent>
          {data.media_type !== 'text' && data.media_url && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                📎 Mídia anexada: {data.media_url}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {messagePreview.filter((msg: string) => msg.trim()).map((message: string, index: number) => (
              <div key={index} className="bg-green-50 p-4 rounded-lg border border-green-200">
                {data.message_fragments?.length > 0 && (
                  <Badge variant="secondary" className="mb-2">
                    Fragmento {index + 1}
                  </Badge>
                )}
                <p className="text-sm">{message}</p>
              </div>
            ))}
          </div>
        </ModernCardContent>
      </ModernCard>

      {/* Audience Info */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Público-Alvo
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {data.target?.config?.tag_ids?.length || 0} etiquetas selecionadas
              </span>
            </div>
            
            {/* Here we would show the actual count from the preview */}
            <Badge variant="outline" className="text-base px-4 py-2">
              Destinatários estimados serão calculados
            </Badge>
          </div>
        </ModernCardContent>
      </ModernCard>

      {/* Schedule Settings */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configurações de Agendamento
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Agendamento</p>
              <p className="font-medium">{formatSchedule()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Limite de Envio</p>
              <p className="font-medium">{data.rate_limit_per_minute} mensagens/minuto</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Horário de Funcionamento</p>
            <p className="font-medium">{formatBusinessHours()}</p>
          </div>
        </ModernCardContent>
      </ModernCard>

      {/* Important Notes */}
      <ModernCard className="border-amber-200 bg-amber-50">
        <ModernCardContent className="p-4">
          <div className="flex gap-3">
            <div className="text-amber-600 mt-1">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800">Atenção</p>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                <li>Verifique se sua instância WhatsApp está conectada antes de iniciar</li>
                <li>Campanhas respeitam automaticamente limites do WhatsApp</li>
                <li>Mensagens fragmentadas serão enviadas em sequência</li>
                <li>Você poderá monitorar o progresso na aba Dashboard</li>
              </ul>
            </div>
          </div>
        </ModernCardContent>
      </ModernCard>
    </div>
  );
};
