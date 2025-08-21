
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { BroadcastService, BroadcastTarget, CreateCampaignData } from '@/services/broadcast/broadcastService';
import { useBroadcastCampaigns } from '@/hooks/broadcast/useBroadcastCampaigns';
import { toast } from 'sonner';
import { Users, MessageSquare, Settings, Target, Clock } from 'lucide-react';

interface NewBroadcastListFormProps {
  onSuccess?: () => void;
}

export const NewBroadcastListForm: React.FC<NewBroadcastListFormProps> = ({
  onSuccess
}) => {
  const { createCampaign } = useBroadcastCampaigns();
  const [loading, setLoading] = useState(false);
  const [funnels, setFunnels] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [preview, setPreview] = useState<{ leads: any[]; totalCount: number }>({
    leads: [],
    totalCount: 0
  });

  // Form data
  const [formData, setFormData] = useState<CreateCampaignData>({
    name: '',
    message_text: '',
    media_type: 'text',
    media_url: '',
    target: {
      type: 'all',
      config: {}
    },
    schedule_type: 'immediate',
    scheduled_at: '',
    rate_limit_per_minute: 2,
    business_hours_only: false,
  });

  // Load options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [funnelsData, tagsData] = await Promise.all([
          BroadcastService.getFunnels(),
          BroadcastService.getTags()
        ]);
        setFunnels(funnelsData);
        setTags(tagsData);
      } catch (error) {
        console.error('Error loading options:', error);
      }
    };
    loadOptions();
  }, []);

  // Load stages when funnel changes
  useEffect(() => {
    if (formData.target.type === 'funnel' && formData.target.config.funnel_id) {
      BroadcastService.getStagesByFunnel(formData.target.config.funnel_id)
        .then(setStages)
        .catch(console.error);
    }
  }, [formData.target.config.funnel_id]);

  // Update preview when target changes
  useEffect(() => {
    const updatePreview = async () => {
      try {
        const previewData = await BroadcastService.getLeadsPreview(formData.target);
        setPreview(previewData);
      } catch (error) {
        console.error('Error loading preview:', error);
        setPreview({ leads: [], totalCount: 0 });
      }
    };

    // Only update preview if we have enough info
    const shouldPreview = 
      formData.target.type === 'all' ||
      (formData.target.type === 'funnel' && formData.target.config.funnel_id) ||
      (formData.target.type === 'stage' && formData.target.config.stage_id) ||
      (formData.target.type === 'tags' && formData.target.config.tag_ids?.length > 0);

    if (shouldPreview) {
      updatePreview();
    }
  }, [formData.target]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateTargetConfig = (config: any) => {
    setFormData(prev => ({
      ...prev,
      target: { ...prev.target, config }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }
    
    if (!formData.message_text.trim()) {
      toast.error('Mensagem é obrigatória');
      return;
    }

    if (preview.totalCount === 0) {
      toast.error('Nenhum destinatário encontrado para os critérios selecionados');
      return;
    }

    setLoading(true);
    try {
      const campaign = await createCampaign(formData);
      if (campaign) {
        // Reset form
        setFormData({
          name: '',
          message_text: '',
          media_type: 'text',
          media_url: '',
          target: { type: 'all', config: {} },
          schedule_type: 'immediate',
          scheduled_at: '',
          rate_limit_per_minute: 2,
          business_hours_only: false,
        });
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Informações da Campanha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Digite um nome para sua campanha"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={formData.message_text}
              onChange={(e) => updateFormData('message_text', e.target.value)}
              placeholder="Digite a mensagem que será enviada para os leads"
              rows={4}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Target Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Público Alvo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tipo de Público</Label>
            <Select
              value={formData.target.type}
              onValueChange={(value: any) => {
                setFormData(prev => ({
                  ...prev,
                  target: { type: value, config: {} }
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os leads</SelectItem>
                <SelectItem value="funnel">Por funil</SelectItem>
                <SelectItem value="stage">Por etapa</SelectItem>
                <SelectItem value="tags">Por tags</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.target.type === 'funnel' && (
            <div>
              <Label>Funil</Label>
              <Select
                value={formData.target.config.funnel_id || ''}
                onValueChange={(value) => updateTargetConfig({ funnel_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funil" />
                </SelectTrigger>
                <SelectContent>
                  {funnels.map((funnel) => (
                    <SelectItem key={funnel.id} value={funnel.id}>
                      {funnel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.target.type === 'stage' && (
            <>
              <div>
                <Label>Funil</Label>
                <Select
                  value={formData.target.config.funnel_id || ''}
                  onValueChange={(value) => updateTargetConfig({ funnel_id: value, stage_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funil" />
                  </SelectTrigger>
                  <SelectContent>
                    {funnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        {funnel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.target.config.funnel_id && (
                <div>
                  <Label>Etapa</Label>
                  <Select
                    value={formData.target.config.stage_id || ''}
                    onValueChange={(value) => updateTargetConfig({ ...formData.target.config, stage_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Preview dos Destinatários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {preview.totalCount} lead{preview.totalCount !== 1 ? 's' : ''}
            </Badge>
            <span className="text-muted-foreground">
              serão incluídos nesta campanha
            </span>
          </div>

          {preview.leads.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Exemplo de destinatários:</Label>
              <div className="bg-muted/50 p-3 rounded-lg max-h-32 overflow-y-auto">
                {preview.leads.slice(0, 10).map((lead) => (
                  <div key={lead.id} className="text-sm flex justify-between py-1">
                    <span>{lead.name || 'Sem nome'}</span>
                    <span className="text-muted-foreground">{lead.phone}</span>
                  </div>
                ))}
                {preview.totalCount > 10 && (
                  <div className="text-sm text-muted-foreground pt-1">
                    ... e mais {preview.totalCount - 10} leads
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Envio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Respeitar Horário Comercial</Label>
              <p className="text-sm text-muted-foreground">
                Enviar apenas das 8h às 18h
              </p>
            </div>
            <Switch
              checked={formData.business_hours_only}
              onCheckedChange={(checked) => updateFormData('business_hours_only', checked)}
            />
          </div>

          <div>
            <Label>Limite de Mensagens por Minuto</Label>
            <Select
              value={String(formData.rate_limit_per_minute)}
              onValueChange={(value) => updateFormData('rate_limit_per_minute', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mensagem/minuto</SelectItem>
                <SelectItem value="2">2 mensagens/minuto</SelectItem>
                <SelectItem value="3">3 mensagens/minuto</SelectItem>
                <SelectItem value="4">4 mensagens/minuto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={loading || preview.totalCount === 0}
          className="min-w-32"
        >
          {loading ? 'Criando...' : 'Criar Campanha'}
        </Button>
      </div>
    </form>
  );
};
