import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BroadcastService } from '@/services/broadcast/broadcastService';
import { MediaUploader } from './MediaUploader';
import { MessageFragmenter } from './MessageFragmenter';
import { InstanceSelector } from './InstanceSelector';
import { AdvancedScheduler, ScheduleConfig } from './AdvancedScheduler';
import { AlertCircle, Send, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface MessageFragment {
  id: string;
  text: string;
  order: number;
}

interface NewBroadcastListFormProps {
  onSuccess?: () => void;
}

export const NewBroadcastListForm: React.FC<NewBroadcastListFormProps> = ({ onSuccess }) => {
  const [campaignName, setCampaignName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video' | 'audio' | 'document'>('text');
  const [fragments, setFragments] = useState<MessageFragment[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    type: 'immediate',
    businessHoursOnly: false,
    startHour: 8,
    endHour: 18,
    weekDays: [1, 2, 3, 4, 5], // Segunda a sexta
    rateLimit: 2
  });

  const [target, setTarget] = useState({
    type: 'all' as const,
    config: {}
  });

  useEffect(() => {
    loadPreview();
  }, [target]);

  const loadPreview = async () => {
    try {
      const preview = await BroadcastService.getLeadsPreview(target);
      setPreviewData(preview);
    } catch (error) {
      console.error('Error loading preview:', error);
    }
  };

  const handleMediaSelect = (file: File | null, type: 'text' | 'image' | 'video' | 'audio' | 'document') => {
    setSelectedFile(file);
    setMediaType(file ? type : 'text');
  };

  const handleSubmit = async () => {
    if (!campaignName.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }

    if (!messageText.trim() && !selectedFile) {
      toast.error('Mensagem ou mídia é obrigatória');
      return;
    }

    if (!selectedInstanceId) {
      toast.error('Selecione uma instância WhatsApp');
      return;
    }

    setIsLoading(true);
    
    try {
      // Preparar dados da campanha
      const campaignData = {
        name: campaignName,
        message_text: fragments.length > 0 
          ? fragments.map(f => f.text).join('\n---\n')
          : messageText,
        media_type: mediaType,
        media_url: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
        target,
        schedule_type: scheduleConfig.type,
        scheduled_at: scheduleConfig.type === 'scheduled' 
          ? `${scheduleConfig.scheduledDate}T${scheduleConfig.scheduledTime}:00`
          : undefined,
        rate_limit_per_minute: scheduleConfig.rateLimit,
        business_hours_only: scheduleConfig.businessHoursOnly
      };

      const result = await BroadcastService.createCampaign(campaignData);
      
      if (result) {
        toast.success('Campanha criada com sucesso!');
        
        // Reset form
        setCampaignName('');
        setMessageText('');
        setSelectedFile(null);
        setMediaType('text');
        setFragments([]);
        setSelectedInstanceId('');
        
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(`Erro ao criar campanha: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova Campanha de Disparo</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="message">Mensagem</TabsTrigger>
              <TabsTrigger value="audience">Público-alvo</TabsTrigger>
              <TabsTrigger value="schedule">Agendamento</TabsTrigger>
              <TabsTrigger value="review">Revisar</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Campanha</Label>
                  <Input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Ex: Promoção de fim de semana"
                  />
                </div>

                <InstanceSelector
                  selectedInstanceId={selectedInstanceId}
                  onInstanceSelect={setSelectedInstanceId}
                />
              </div>
            </TabsContent>

            <TabsContent value="message" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Texto da Mensagem</Label>
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="min-h-[120px]"
                  />
                </div>

                <MediaUploader
                  onMediaSelect={handleMediaSelect}
                  selectedFile={selectedFile}
                  mediaType={mediaType}
                />

                {messageText && (
                  <MessageFragmenter
                    initialMessage={messageText}
                    onFragmentsChange={setFragments}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="audience" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sistema de filtros por etiquetas será implementado em breve. 
                  Atualmente enviando para todos os leads.
                </AlertDescription>
              </Alert>
              
              {previewData && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Destinatários:</span>
                      <span className="font-medium">{previewData.totalCount} leads</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <AdvancedScheduler
                config={scheduleConfig}
                onConfigChange={setScheduleConfig}
              />
            </TabsContent>

            <TabsContent value="review" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Revisão da Campanha
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Nome:</span>
                        <p className="font-medium">{campaignName || 'Não definido'}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600">Tipo de mídia:</span>
                        <p className="font-medium capitalize">{mediaType}</p>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600">Fragmentos:</span>
                        <p className="font-medium">
                          {fragments.length > 0 ? `${fragments.length} parte(s)` : '1 parte'}
                        </p>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600">Destinatários:</span>
                        <p className="font-medium">{previewData?.totalCount || 0} leads</p>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600">Agendamento:</span>
                        <p className="font-medium">
                          {scheduleConfig.type === 'immediate' ? 'Imediato' : 'Agendado'}
                        </p>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600">Taxa de envio:</span>
                        <p className="font-medium">{scheduleConfig.rateLimit} msg/min</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <span className="text-sm text-gray-600">Prévia da mensagem:</span>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">{messageText || 'Mensagem não definida'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading || !campaignName || !selectedInstanceId}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Criando campanha...
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Criar Campanha
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
