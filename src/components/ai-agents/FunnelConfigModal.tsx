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
  
  const [stageDescriptions, setStageDescriptions] = useState<Record<string, string>>({});
  const [stageNotifications, setStageNotifications] = useState<Record<string, boolean>>({});
  const [stagePhones, setStagePhones] = useState<Record<string, string>>({});

  // Carregar dados quando modal abrir
  useEffect(() => {
    if (isOpen && agent?.funnel_id) {
      loadFunnelData(agent.funnel_id);
    } else if (isOpen && !agent?.funnel_id) {
      // Reset se não houver funil
      setFunnelStages([]);
      setFunnelInfo(null);
      resetFormData();
    }
  }, [isOpen, agent?.funnel_id]);

  const resetFormData = () => {
    setStageDescriptions({});
    setStageNotifications({});
    setStagePhones({});
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
      const phones: Record<string, string> = {};
      
      stagesData?.forEach(stage => {
        descriptions[stage.id] = stage.ai_stage_description || '';
        notifications[stage.id] = stage.ai_notify_enabled || false;
        phones[stage.id] = stage.notify_phone ? formatPhoneNumber(stage.notify_phone) : '';
      });

      setStageDescriptions(descriptions);
      setStageNotifications(notifications);
      setStagePhones(phones);

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


  const formatPhoneNumber = (value: string) => {
    console.log('📞 formatPhoneNumber entrada:', value);
    // Permitir apenas números
    const numbers = value.replace(/\D/g, '');
    console.log('📞 Números extraídos:', numbers);
    
    // Limitar a 13 dígitos
    const cleanNumbers = numbers.substring(0, 13);
    console.log('📞 Números limpos:', cleanNumbers);
    
    // Aplicar formatação apenas se houver números suficientes
    if (cleanNumbers.length <= 2) {
      return cleanNumbers;
    } else if (cleanNumbers.length <= 4) {
      return `${cleanNumbers.substring(0, 2)} (${cleanNumbers.substring(2)})`;
    } else if (cleanNumbers.length <= 6) {
      return `${cleanNumbers.substring(0, 2)} (${cleanNumbers.substring(2, 4)}) ${cleanNumbers.substring(4)}`;
    } else if (cleanNumbers.length <= 10) {
      return `${cleanNumbers.substring(0, 2)} (${cleanNumbers.substring(2, 4)}) ${cleanNumbers.substring(4)}`;
    } else if (cleanNumbers.length === 11) {
      return `${cleanNumbers.substring(0, 2)} (${cleanNumbers.substring(2, 4)}) ${cleanNumbers.substring(4)}`;
    } else if (cleanNumbers.length >= 12) {
      // Formato completo: 55 (62) 99999-9999
      return `${cleanNumbers.substring(0, 2)} (${cleanNumbers.substring(2, 4)}) ${cleanNumbers.substring(4, 9)}-${cleanNumbers.substring(9)}`;
    }
    
    return cleanNumbers;
  };

  const formatPhoneForDatabase = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Se já começar com 55, usar como está (limitado a 13 dígitos)
    if (numbers.startsWith('55')) {
      return numbers.substring(0, 13);
    } else if (numbers.length >= 11) {
      // Se não começar com 55 mas tem 11+ dígitos, adicionar 55
      return '55' + numbers.substring(0, 11);
    } else if (numbers.length >= 10) {
      // Para números com 10 dígitos, adicionar 55
      return '55' + numbers;
    }
    
    // Retornar como está se for muito curto
    return numbers;
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    // Deve ter pelo menos 11 dígitos (DDD + número) ou 13 com código do país (55)
    return numbers.length >= 11;
  };

  const handleStagePhoneChange = (stageId: string, value: string) => {
    console.log('📱 handleStagePhoneChange chamado:', { stageId, value });
    const formatted = formatPhoneNumber(value);
    console.log('📱 Telefone formatado:', { original: value, formatted });
    setStagePhones(prev => ({ ...prev, [stageId]: formatted }));
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

    // Validar telefones dos estágios com notificação ativa
    for (const stage of funnelStages) {
      if (stageNotifications[stage.id] && stagePhones[stage.id] && !validatePhone(stagePhones[stage.id])) {
        toast.error('Telefone inválido', {
          description: `Digite um telefone válido para o estágio "${stage.title}" (mínimo 11 dígitos)`,
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      console.log('💾 Salvando configurações individuais por estágio...');

      // Salvar configurações de cada estágio (excluindo automáticos)
      const stageUpdates = funnelStages
        .filter(stage => stage.title !== 'Entrada de Leads' && stage.title !== 'Em atendimento')
        .map(stage => ({
          id: stage.id,
          ai_stage_description: stageDescriptions[stage.id] || '',
          ai_notify_enabled: stageNotifications[stage.id] || false,
          notify_phone: (stageNotifications[stage.id] && stagePhones[stage.id]) 
            ? formatPhoneForDatabase(stagePhones[stage.id]) 
            : '',
        }));

      console.log('📝 Dados que serão salvos:', stageUpdates.map(u => ({
        id: u.id,
        ai_notify_enabled: u.ai_notify_enabled,
        notify_phone: u.notify_phone ? 'PREENCHIDO' : 'VAZIO'
      })));

      for (const update of stageUpdates) {
        try {
          console.log(`📱 Salvando estágio ${update.id}:`, {
            ai_notify_enabled: update.ai_notify_enabled,
            notify_phone: update.notify_phone || 'VAZIO'
          });

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

      // Fechar modal após sucesso com feedback melhor
      setTimeout(() => {
        console.log('🚪 Fechando FunnelConfigModal automaticamente após salvamento bem-sucedido');
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
            Ensine o agente quando mover os leads entre os estágios do funil
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

              {/* Lista de Estágios */}
              {funnelStages.length > 0 && (
                <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                      <Target className="h-5 w-5 text-yellow-500" />
                      Estágios do Funil ({funnelStages.length})
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Explique quando um lead deve estar em cada estágio
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {funnelStages.map((stage, index) => {
                      // Pular configuração para as duas primeiras etapas (automáticas)
                      const isAutomaticStage = stage.title === 'Entrada de Leads' || stage.title === 'Em atendimento';
                      
                      if (isAutomaticStage) {
                        return (
                          <div 
                            key={stage.id}
                            className="p-4 bg-green-50/80 backdrop-blur-sm border border-green-200/60 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                  style={{ backgroundColor: stage.color || '#e0e0e0' }}
                                >
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                                    {getStageEmoji(stage.order_position)} {stage.title}
                                  </h4>
                                  <p className="text-xs text-green-600">Configuração automática - A IA já entende este estágio</p>
                                </div>
                              </div>
                              <div className="text-green-600">
                                ✅ Automático
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
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
                          
                          {/* Toggle notificação do estágio - sempre visível */}
                          <div className="flex items-center gap-3">
                            {stageNotifications[stage.id] ? (
                              <Bell className="h-4 w-4 text-green-600" />
                            ) : (
                              <BellOff className="h-4 w-4 text-gray-400" />
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 font-medium">Notificar:</span>
                              <Switch
                                checked={stageNotifications[stage.id] || false}
                                onCheckedChange={(checked) => handleStageNotificationToggle(stage.id, checked)}
                                className="data-[state=checked]:bg-green-600"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Campo descrição IA */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            📝 Quando um lead deve estar neste estágio:
                          </Label>
                          <Textarea
                            value={stageDescriptions[stage.id] || ''}
                            onChange={(e) => handleStageDescriptionChange(stage.id, e.target.value)}
                            placeholder={`Ex: Quando o lead pede orçamento, quando demonstra interesse em comprar, quando faz perguntas sobre valores...`}
                            className="min-h-20 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg resize-none text-sm"
                            rows={3}
                          />
                        </div>

                        {/* Campo de telefone - só aparece se notificação estiver ativa */}
                        {stageNotifications[stage.id] && (
                          <div className="space-y-2 p-3 bg-green-50/50 border border-green-200/50 rounded-lg">
                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <Phone className="h-4 w-4 text-green-600" />
                              📱 Telefone para notificações deste estágio
                            </Label>
                            <Input
                              value={stagePhones[stage.id] || ''}
                              onChange={(e) => handleStagePhoneChange(stage.id, e.target.value)}
                              placeholder="55 (62) 99999-9999"
                              className="bg-white/60 backdrop-blur-sm border border-green-300/50 focus:border-green-500 rounded-lg"
                            />
                            {stagePhones[stage.id] && !validatePhone(stagePhones[stage.id]) && (
                              <div className="flex items-center gap-2 text-xs text-red-600">
                                <AlertCircle className="h-3 w-3" />
                                Digite um telefone válido (mínimo 11 dígitos)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      );
                    })}
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