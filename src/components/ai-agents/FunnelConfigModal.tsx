import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AIAgent } from "@/types/aiAgent";
import { 
  Target, 
  Phone, 
  Bell,
  BellOff,
  Save, 
  X, 
  Settings,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

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

interface FunnelInfo {
  id: string;
  name: string;
}

interface FunnelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: any) => Promise<void>;
  title: string;
  icon: React.ReactNode;
  agent?: AIAgent | null;
}

export const FunnelConfigModal = ({
  isOpen,
  onClose,
  onSave,
  title,
  icon,
  agent
}: FunnelConfigModalProps) => {
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [funnelInfo, setFunnelInfo] = useState<FunnelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [globalNotifyPhone, setGlobalNotifyPhone] = useState('');
  const [globalNotifyEnabled, setGlobalNotifyEnabled] = useState(false);
  const [stageDescriptions, setStageDescriptions] = useState<Record<string, string>>({});
  const [stageNotifications, setStageNotifications] = useState<Record<string, boolean>>({});

  // Carregar dados quando modal abrir
  useEffect(() => {
    if (isOpen && agent?.funnel_id) {
      loadFunnelData(agent.funnel_id);
      loadAgentNotificationData();
    } else if (isOpen && !agent?.funnel_id) {
      // Reset se não houver funil
      setFunnelStages([]);
      setFunnelInfo(null);
      resetFormData();
    }
  }, [isOpen, agent?.funnel_id]);

  const resetFormData = () => {
    setGlobalNotifyPhone('');
    setGlobalNotifyEnabled(false);
    setStageDescriptions({});
    setStageNotifications({});
  };

  const loadFunnelData = async (funnelId: string) => {
    console.log('🔄 Carregando dados do funil:', funnelId);
    setIsLoading(true);

    try {
      // Buscar informações do funil
      const { data: funnelData, error: funnelError } = await supabase
        .from('funnels')
        .select('id, name')
        .eq('id', funnelId)
        .single();

      if (funnelError) throw funnelError;
      setFunnelInfo(funnelData);

      // Buscar estágios do funil
      const { data: stagesData, error: stagesError } = await supabase
        .from('kanban_stages')
        .select(`
          id, 
          title, 
          color, 
          order_position,
          ai_stage_description,
          ai_notify_enabled,
          notify_phone,
          funnel_id
        `)
        .eq('funnel_id', funnelId)
        .order('order_position', { ascending: true });

      if (stagesError) {
        console.warn('⚠️ Erro ao carregar estágios (provavelmente campos AI ainda não existem):', stagesError);
        
        // Se erro for sobre campos que não existem, tentar sem os campos AI
        if (stagesError.message.includes('ai_stage_description') || stagesError.message.includes('ai_notify_enabled')) {
          console.log('🔄 Tentando carregar estágios sem campos AI...');
          const { data: basicStagesData, error: basicStagesError } = await supabase
            .from('kanban_stages')
            .select('id, title, color, order_position, funnel_id')
            .eq('funnel_id', funnelId)
            .order('order_position', { ascending: true });

          if (basicStagesError) throw basicStagesError;

          // Mapear para formato esperado com campos AI vazios
          const stagesWithDefaults = basicStagesData?.map(stage => ({
            ...stage,
            ai_stage_description: '',
            ai_notify_enabled: false,
            notify_phone: ''
          })) || [];

          setFunnelStages(stagesWithDefaults);
          console.log('✅ Estágios básicos carregados:', stagesWithDefaults.length);
        } else {
          throw stagesError;
        }
      } else {
        console.log('✅ Estágios carregados:', stagesData?.length || 0);
        setFunnelStages(stagesData || []);
      }

      // Mapear dados para o estado local
      const descriptions: Record<string, string> = {};
      const notifications: Record<string, boolean> = {};
      let hasAnyNotification = false;
      let globalPhone = '';
      
      stagesData?.forEach(stage => {
        descriptions[stage.id] = stage.ai_stage_description || '';
        notifications[stage.id] = stage.ai_notify_enabled || false;
        
        // Se algum estágio tem notificação ativa, pegar o telefone dele como padrão global
        if (stage.ai_notify_enabled && stage.notify_phone && !globalPhone) {
          globalPhone = stage.notify_phone;
          hasAnyNotification = true;
        }
      });

      setStageDescriptions(descriptions);
      setStageNotifications(notifications);
      
      // Se encontrou algum telefone em uso, configurar como telefone global
      if (globalPhone) {
        setGlobalNotifyPhone(globalPhone);
        setGlobalNotifyEnabled(hasAnyNotification);
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados do funil:', error);
      toast.error('Erro ao carregar estágios do funil');
      setFunnelStages([]);
      setFunnelInfo(null);
      resetFormData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadAgentNotificationData = async () => {
    if (!agent?.id) return;

    try {
      // Como global_notify_phone ainda não existe, vamos verificar se já foi implementado
      const { data: agentData, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agent.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignorar "not found"
        throw error;
      }

      // Verificar se o campo global_notify_phone existe na resposta
      if (agentData && 'global_notify_phone' in agentData && agentData.global_notify_phone) {
        setGlobalNotifyPhone(agentData.global_notify_phone as string);
        setGlobalNotifyEnabled(true);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar telefone global:', error);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length >= 11) {
      const formatted = numbers.substring(0, 13);
      return `+${formatted.substring(0, 2)} ${formatted.substring(2, 4)} ${formatted.substring(4, 9)}-${formatted.substring(9, 13)}`;
    } else if (numbers.length >= 2) {
      return `+${numbers}`;
    }
    
    return value;
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length >= 11;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setGlobalNotifyPhone(formatted);
  };

  const handleStageDescriptionChange = (stageId: string, value: string) => {
    setStageDescriptions(prev => ({ ...prev, [stageId]: value }));
  };

  const handleStageNotificationToggle = (stageId: string, enabled: boolean) => {
    setStageNotifications(prev => ({ ...prev, [stageId]: enabled }));
  };

  const handleSave = async () => {
    if (!agent?.id || !agent?.funnel_id) {
      toast.error('Agente ou funil não encontrado');
      return;
    }

    // Validações
    if (globalNotifyEnabled && !validatePhone(globalNotifyPhone)) {
      toast.error('Telefone inválido', {
        description: 'Digite um telefone válido no formato +55 11 99999-9999',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Por enquanto, não salvar telefone global até a migração ser aplicada
      console.log('📞 Telefone global configurado:', globalNotifyEnabled ? globalNotifyPhone : 'Desabilitado');

      // Salvar configurações de cada estágio
      const stageUpdates = funnelStages.map(stage => ({
        id: stage.id,
        ai_stage_description: stageDescriptions[stage.id] || '',
        ai_notify_enabled: globalNotifyEnabled && stageNotifications[stage.id],
        notify_phone: (globalNotifyEnabled && stageNotifications[stage.id]) ? globalNotifyPhone : '',
      }));

      for (const update of stageUpdates) {
        try {
          const { error: stageError } = await supabase
            .from('kanban_stages')
            .update({
              ai_stage_description: update.ai_stage_description,
              ai_notify_enabled: update.ai_notify_enabled,
              notify_phone: update.notify_phone,
            })
            .eq('id', update.id);

          if (stageError) {
            console.error('❌ Erro ao atualizar estágio:', update.id, stageError);
            
            // Se erro for por campo inexistente, avisar mas não bloquear
            if (stageError.message.includes('ai_stage_description') || 
                stageError.message.includes('ai_notify_enabled') ||
                stageError.message.includes('notify_phone')) {
              console.warn('⚠️ Campos AI ainda não existem no banco - execute a migração primeiro');
              toast.error('Campos AI não encontrados', {
                description: 'Execute as migrações do banco para usar esta funcionalidade',
                duration: 4000,
              });
              return;
            }
            
            throw stageError;
          }
        } catch (error) {
          console.error('❌ Erro crítico ao salvar estágio:', update.id, error);
          throw error;
        }
      }

      toast.success('Configuração do funil salva com sucesso', {
        description: '💾 Todas as alterações foram persistidas',
        duration: 2000,
      });

      // Chamar onSave do parent para atualizar estado
      await onSave({ configured: true });

      // Fechar modal após sucesso
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('❌ Erro ao salvar configuração do funil:', error);
      toast.error('Erro ao salvar configuração do funil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    resetFormData();
    onClose();
  };

  const getStageEmoji = (position: number) => {
    const emojis = ['🎯', '👀', '📋', '💬', '🤝', '✅', '🏆', '🎉'];
    return emojis[position - 1] || '📌';
  };

  // Estado: Nenhum funil selecionado
  if (!agent?.funnel_id) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-xl">
          <DialogHeader className="border-b border-white/30 pb-3 bg-white/20 backdrop-blur-sm rounded-t-xl -mx-6 -mt-6 px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              {icon}
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 text-center space-y-4">
            <div className="p-4 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/60 rounded-xl">
              <Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold text-yellow-800 mb-2">
                Nenhum funil selecionado
              </h3>
              <p className="text-sm text-yellow-700">
                Para configurar os estágios, primeiro selecione um funil na <strong>Aba 1 - Informações Básicas</strong>.
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-4 border-t border-white/30 bg-white/10 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
            <Button 
              onClick={handleClose}
              className="bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl"
            >
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-xl">
        <DialogHeader className="border-b border-white/30 pb-3 bg-white/20 backdrop-blur-sm rounded-t-xl -mx-6 -mt-6 px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            {icon}
            {title}
            {funnelInfo && (
              <Badge variant="outline" className="bg-white/40">
                {funnelInfo.name}
              </Badge>
            )}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Configure como a IA deve identificar e notificar sobre cada estágio do funil
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4 max-h-[calc(90vh-200px)]">
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white/20 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Configuração de Telefone Global */}
              <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                    <Phone className="h-5 w-5 text-yellow-500" />
                    Telefone para Notificações
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Configure um telefone único para receber notificações de todos os estágios
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Toggle Global */}
                  <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      {globalNotifyEnabled ? (
                        <Bell className="h-5 w-5 text-green-600" />
                      ) : (
                        <BellOff className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-800">
                          Ativar notificações WhatsApp
                        </p>
                        <p className="text-sm text-gray-600">
                          {globalNotifyEnabled ? 'Notificações ativas para estágios selecionados' : 'Nenhuma notificação será enviada'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={globalNotifyEnabled}
                      onCheckedChange={setGlobalNotifyEnabled}
                    />
                  </div>

                  {/* Campo Telefone */}
                  {globalNotifyEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="global_phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Phone className="h-4 w-4 text-gray-500" />
                        Telefone para receber todas as notificações
                      </Label>
                      <Input
                        id="global_phone"
                        value={globalNotifyPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="+55 11 99999-9999"
                        className="bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg"
                      />
                      {globalNotifyPhone && !validatePhone(globalNotifyPhone) && (
                        <div className="flex items-center gap-2 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          Digite um telefone válido (mínimo 11 dígitos)
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lista de Estágios */}
              {funnelStages.length > 0 && (
                <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                      <Target className="h-5 w-5 text-yellow-500" />
                      Estágios do Funil ({funnelStages.length})
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Configure a descrição IA e ative notificações para cada estágio
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {funnelStages.map((stage, index) => (
                      <div 
                        key={stage.id}
                        className="p-4 bg-white/30 backdrop-blur-sm border border-white/20 rounded-lg space-y-3"
                      >
                        {/* Header do estágio */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: stage.color || '#e0e0e0' }}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                {getStageEmoji(stage.order_position)} {stage.title}
                              </h4>
                              <p className="text-xs text-gray-500">Posição: {stage.order_position}</p>
                            </div>
                          </div>
                          
                          {/* Toggle notificação do estágio */}
                          {globalNotifyEnabled && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">Notificar:</span>
                              <Switch
                                checked={stageNotifications[stage.id] || false}
                                onCheckedChange={(checked) => handleStageNotificationToggle(stage.id, checked)}
                              />
                            </div>
                          )}
                        </div>

                        {/* Campo descrição IA */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            📝 Como a IA identifica este estágio:
                          </Label>
                          <Textarea
                            value={stageDescriptions[stage.id] || ''}
                            onChange={(e) => handleStageDescriptionChange(stage.id, e.target.value)}
                            placeholder={`Ex: Lead demonstrou interesse, fez perguntas específicas sobre ${stage.title.toLowerCase()}, solicitou informações detalhadas...`}
                            className="min-h-20 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg resize-none text-sm"
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Footer com botões */}
        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t border-white/30 bg-white/10 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isSaving}
            className="px-6 h-11 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl transition-all duration-200"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-8 h-11 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl shadow-glass hover:shadow-glass-lg transition-all duration-200 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configuração
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};