
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useBroadcastCampaigns } from '@/hooks/broadcast/useBroadcastCampaigns';
import { BroadcastService } from '@/services/broadcast/broadcastService';
import { TargetAudienceSelector } from './TargetAudienceSelector';
import { Send, Calendar, Clock } from 'lucide-react';

interface CampaignForm {
  name: string;
  message_text: string;
  media_type: 'text' | 'image' | 'video' | 'audio' | 'document';
  media_url?: string;
  target_type: 'all' | 'funnel' | 'stage' | 'tags' | 'custom';
  target_config: any;
  schedule_type: 'immediate' | 'scheduled';
  scheduled_at?: string;
  rate_limit_per_minute: number;
  business_hours_only: boolean;
}

export const CreateCampaignForm = () => {
  const { createCampaign } = useBroadcastCampaigns();
  const [loading, setLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState(0);
  
  const [form, setForm] = useState<CampaignForm>({
    name: '',
    message_text: '',
    media_type: 'text',
    target_type: 'all',
    target_config: {},
    schedule_type: 'immediate',
    rate_limit_per_minute: 2,
    business_hours_only: false,
  });

  const handleTargetChange = async (target: any) => {
    setForm({ ...form, target_type: target.type, target_config: target.config });
    
    // Preview count
    try {
      const preview = await BroadcastService.getLeadsPreview(target);
      setPreviewCount(preview.totalCount);
    } catch (error) {
      console.error('Erro ao buscar preview:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }
    
    if (!form.message_text.trim()) {
      toast.error('Mensagem é obrigatória');
      return;
    }

    setLoading(true);
    
    try {
      const campaign = await createCampaign({
        name: form.name,
        message_text: form.message_text,
        media_type: form.media_type,
        media_url: form.media_url,
        target_type: form.target_type,
        target_config: form.target_config,
        schedule_type: form.schedule_type,
        scheduled_at: form.scheduled_at,
        rate_limit_per_minute: form.rate_limit_per_minute,
        business_hours_only: form.business_hours_only,
        timezone: 'America/Sao_Paulo',
        status: 'draft'
      });

      if (campaign) {
        toast.success('Campanha criada com sucesso!');
        // Reset form
        setForm({
          name: '',
          message_text: '',
          media_type: 'text',
          target_type: 'all',
          target_config: {},
          schedule_type: 'immediate',
          rate_limit_per_minute: 2,
          business_hours_only: false,
        });
        setPreviewCount(0);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar campanha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações da Campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Promoção Black Friday"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={form.message_text}
              onChange={(e) => setForm({ ...form, message_text: e.target.value })}
              placeholder="Digite sua mensagem..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="media_type">Tipo de Mídia</Label>
            <Select 
              value={form.media_type}
              onValueChange={(value: any) => setForm({ ...form, media_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">📝 Apenas Texto</SelectItem>
                <SelectItem value="image">🖼️ Imagem</SelectItem>
                <SelectItem value="video">🎥 Vídeo</SelectItem>
                <SelectItem value="audio">🎵 Áudio</SelectItem>
                <SelectItem value="document">📄 Documento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.media_type !== 'text' && (
            <div>
              <Label htmlFor="media_url">URL da Mídia</Label>
              <Input
                id="media_url"
                value={form.media_url || ''}
                onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                placeholder="https://example.com/media.jpg"
                type="url"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Público-Alvo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Público-Alvo</CardTitle>
        </CardHeader>
        <CardContent>
          <TargetAudienceSelector onTargetChange={handleTargetChange} />
          {previewCount > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                📊 {previewCount} destinatário{previewCount !== 1 ? 's' : ''} selecionado{previewCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agendamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="schedule_type">Quando Enviar</Label>
            <Select 
              value={form.schedule_type}
              onValueChange={(value: any) => setForm({ ...form, schedule_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Enviar Agora
                  </div>
                </SelectItem>
                <SelectItem value="scheduled">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Agendar para Later
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.schedule_type === 'scheduled' && (
            <div>
              <Label htmlFor="scheduled_at">Data e Hora</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={form.scheduled_at || ''}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                required={form.schedule_type === 'scheduled'}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="rate_limit">Mensagens por Minuto</Label>
            <Select 
              value={form.rate_limit_per_minute.toString()}
              onValueChange={(value) => setForm({ ...form, rate_limit_per_minute: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mensagem/minuto (Mais Seguro)</SelectItem>
                <SelectItem value="2">2 mensagens/minuto (Recomendado)</SelectItem>
                <SelectItem value="3">3 mensagens/minuto (Rápido)</SelectItem>
                <SelectItem value="5">5 mensagens/minuto (Arriscado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="business_hours"
              checked={form.business_hours_only}
              onCheckedChange={(checked) => setForm({ ...form, business_hours_only: !!checked })}
            />
            <Label htmlFor="business_hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Apenas horário comercial (8h às 18h)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Criando...' : 'Criar Campanha'}
        </Button>
      </div>
    </form>
  );
};
