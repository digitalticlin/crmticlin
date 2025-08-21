
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Users, Send, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useBroadcastCampaigns } from '@/hooks/broadcast/useBroadcastCampaigns';
import { BroadcastTarget, CreateCampaignData } from '@/types/broadcast';
import { LeadsPreview } from '@/components/broadcast/LeadsPreview';

interface NewBroadcastListFormProps {
  onSuccess?: () => void;
}

export const NewBroadcastListForm: React.FC<NewBroadcastListFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [mediaType, setMediaType] = useState<string>('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [target, setTarget] = useState<BroadcastTarget>({
    type: 'all',
    config: {}
  });
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled' | 'recurring'>('immediate');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(3);
  const [businessHoursOnly, setBusinessHoursOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { createCampaign } = useBroadcastCampaigns();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!name.trim() || !messageText.trim()) {
        toast.error('Por favor, preencha o nome e a mensagem da campanha');
        return;
      }

      if (!target.type) {
        toast.error('Por favor, selecione o tipo de destinatário');
        return;
      }

      const campaignData: CreateCampaignData = {
        name: name.trim(),
        message_text: messageText.trim(),
        media_type: mediaType || undefined,
        media_url: mediaUrl || undefined,
        target,
        schedule_type: scheduleType,
        scheduled_at: scheduledAt || undefined,
        rate_limit_per_minute: rateLimitPerMinute,
        business_hours_only: businessHoursOnly,
      };

      const result = await createCampaign(campaignData);
      
      if (result) {
        toast.success('Campanha criada com sucesso!');
        // Reset form
        setName('');
        setMessageText('');
        setMediaType('');
        setMediaUrl('');
        setTarget({ type: 'all', config: {} });
        setScheduleType('immediate');
        setScheduledAt('');
        setRateLimitPerMinute(3);
        setBusinessHoursOnly(true);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Erro ao criar campanha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações da Campanha
          </CardTitle>
          <CardDescription>
            Configure as informações básicas da sua campanha de disparo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Promoção Black Friday 2024"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mediaType">Tipo de Mídia (Opcional)</Label>
              <Select value={mediaType} onValueChange={setMediaType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="audio">Áudio</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mediaType && (
              <div>
                <Label htmlFor="mediaUrl">URL da Mídia</Label>
                <Input
                  id="mediaUrl"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://exemplo.com/arquivo.jpg"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Destinatários
          </CardTitle>
          <CardDescription>
            Escolha quem receberá esta campanha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="targetType">Tipo de Destinatário</Label>
            <Select 
              value={target.type} 
              onValueChange={(value: 'all' | 'funnel' | 'stage' | 'tags' | 'custom') => 
                setTarget({ ...target, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os contatos</SelectItem>
                <SelectItem value="funnel">Por funil</SelectItem>
                <SelectItem value="stage">Por etapa do funil</SelectItem>
                <SelectItem value="tags">Por tags</SelectItem>
                <SelectItem value="custom">Lista personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {target.type === 'custom' && (
            <div>
              <Label htmlFor="phoneNumbers">Números de Telefone</Label>
              <Textarea
                id="phoneNumbers"
                value={target.config?.phone_numbers?.join('\n') || ''}
                onChange={(e) => setTarget({
                  ...target,
                  config: {
                    ...target.config,
                    phone_numbers: e.target.value.split('\n').filter(n => n.trim())
                  }
                })}
                placeholder="Digite um número por linha&#10;5511999999999&#10;5511888888888"
                rows={4}
              />
            </div>
          )}

          <LeadsPreview 
            leads={[]}
            totalCount={0}
            isLoading={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Agendamento
          </CardTitle>
          <CardDescription>
            Configure quando a campanha deve ser enviada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="scheduleType">Tipo de Envio</Label>
            <Select value={scheduleType} onValueChange={(value: 'immediate' | 'scheduled' | 'recurring') => setScheduleType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione quando enviar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Enviar agora</SelectItem>
                <SelectItem value="scheduled">Agendar para data específica</SelectItem>
                <SelectItem value="recurring">Campanha recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scheduleType === 'scheduled' && (
            <div>
              <Label htmlFor="scheduledAt">Data e Hora do Envio</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="rateLimit">Limite de Envios por Minuto</Label>
            <Select 
              value={rateLimitPerMinute.toString()} 
              onValueChange={(value) => setRateLimitPerMinute(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 mensagens/minuto (mais seguro)</SelectItem>
                <SelectItem value="3">3 mensagens/minuto (recomendado)</SelectItem>
                <SelectItem value="4">4 mensagens/minuto (moderado)</SelectItem>
                <SelectItem value="5">5 mensagens/minuto (arriscado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="businessHours"
              checked={businessHoursOnly}
              onCheckedChange={setBusinessHoursOnly}
            />
            <Label htmlFor="businessHours">Enviar apenas em horário comercial (8h às 18h)</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Salvar Rascunho
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Send className="h-4 w-4 mr-2" />
          {isLoading ? 'Criando...' : 'Criar Campanha'}
        </Button>
      </div>
    </form>
  );
};
