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
  Phone, 
  Bell,
  BellOff,
  Save, 
  X, 
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
}

interface StageNotificationConfigProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AIAgent | null;
}

export const StageNotificationConfig = ({
  isOpen,
  onClose,
  agent,
}: StageNotificationConfigProps) => {
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [stageDescriptions, setStageDescriptions] = useState<Record<string, string>>({});
  const [stageNotifications, setStageNotifications] = useState<Record<string, boolean>>({});
  const [stagePhones, setStagePhones] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Função para formatar telefone para exibição: 556299999999 -> 55 (62) 9999-9999
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    // Se começar com 55, não adicionar novamente
    let cleanNumbers = numbers;
    if (numbers.startsWith('55') && numbers.length > 13) {
      cleanNumbers = numbers.substring(0, 13);
    } else if (!numbers.startsWith('55') && numbers.length >= 11) {
      cleanNumbers = '55' + numbers.substring(0, 11);
    }
    
    // Formatação para display: 55 (62) 9999-9999
    if (cleanNumbers.length >= 13) {
      return `${cleanNumbers.substring(0, 2)} (${cleanNumbers.substring(2, 4)}) ${cleanNumbers.substring(4, 9)}-${cleanNumbers.substring(9, 13)}`;
    } else if (cleanNumbers.length >= 11) {
      return `${cleanNumbers.substring(0, 2)} (${cleanNumbers.substring(2, 4)}) ${cleanNumbers.substring(4)}`;
    } else if (cleanNumbers.length >= 4) {
      return `${cleanNumbers.substring(0, 2)} (${cleanNumbers.substring(2, 4)}) ${cleanNumbers.substring(4)}`;
    } else if (cleanNumbers.length >= 2) {
      return `${cleanNumbers.substring(0, 2)} (${cleanNumbers.substring(2)}`;
    } else {
      return cleanNumbers;
    }
  };

  // Função para formatar telefone para banco: 55 (62) 9999-9999 -> 556299999999
  const formatPhoneForDatabase = (value: string) => {
    // Remove todos os caracteres não numéricos e formata para 556299999999
    const numbers = value.replace(/\D/g, '');
    
    // Se começar com 55, usar como está (limitado a 13 dígitos)
    if (numbers.startsWith('55') && numbers.length >= 13) {
      return numbers.substring(0, 13);
    } else if (numbers.startsWith('55') && numbers.length >= 11) {
      return numbers;
    } else if (numbers.length >= 11) {
      // Se não começar com 55, adicionar 55 na frente
      return '55' + numbers.substring(0, 11);
    }
    
    return numbers;
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    // Deve ter pelo menos 11 dígitos (DDD + número) ou 13 com código do país (55)
    return numbers.length >= 11;
  };

  const handlePhoneChange = (stageId: string, value: string) => {
    const formatted = formatPhoneNumber(value);
    setStagePhones(prev => ({ ...prev, [stageId]: formatted }));
  };

  const handleStageDescriptionChange = (stageId: string, value: string) => {
    setStageDescriptions(prev => ({ ...prev, [stageId]: value }));
  };

  const handleStageNotificationToggle = (stageId: string, enabled: boolean) => {
    setStageNotifications(prev => ({ ...prev, [stageId]: enabled }));
  };

  const loadFunnelStages = async () => {
    if (!agent?.funnel_id) {
      console.log('❌ Nenhum funil selecionado para o agente');
      setIsLoading(false);
      return;
    }

    try {
      console.log('📊 Carregando estágios do funil:', agent.funnel_id);
      
      const { data: stages, error } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('funnel_id', agent.funnel_id)
        .order('order_position');

      if (error) {
        console.error('❌ Erro ao buscar estágios:', error);
        toast.error('Erro ao carregar estágios do funil');
        return;
      }

      console.log('✅ Estágios carregados:', stages?.length || 0);
      setFunnelStages(stages || []);

      // Inicializar estados com dados existentes
      const descriptions: Record<string, string> = {};
      const notifications: Record<string, boolean> = {};
      const phones: Record<string, string> = {};

      stages?.forEach(stage => {
        descriptions[stage.id] = stage.ai_stage_description || '';
        notifications[stage.id] = stage.ai_notify_enabled || false;
        phones[stage.id] = stage.notify_phone ? formatPhoneNumber(stage.notify_phone) : '';
      });

      setStageDescriptions(descriptions);
      setStageNotifications(notifications);
      setStagePhones(phones);

    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
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
      console.log('💾 Salvando configurações de notificação por estágio...');

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

      console.log('📝 Atualizações a serem salvas:', stageUpdates.length);

      for (const update of stageUpdates) {
        try {
          console.log(`📱 Salvando estágio ${update.id}:`, {
            notify_enabled: update.ai_notify_enabled,
            phone: update.notify_phone ? 'PREENCHIDO' : 'VAZIO'
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
                description: 'Execute as migrações do banco de dados primeiro',
              });
              continue;
            }
            
            throw stageError;
          }

          console.log('✅ Estágio salvo com sucesso:', update.id);
        } catch (error) {
          console.error('❌ Erro ao salvar estágio:', update.id, error);
          toast.error(`Erro ao salvar estágio ${update.id}`);
        }
      }

      toast.success('Configurações salvas com sucesso!', {
        description: 'As notificações por estágio foram configuradas.',
      });

      console.log('✅ Todas as configurações foram salvas');

    } catch (error) {
      console.error('❌ Erro geral ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isOpen && agent?.funnel_id) {
      loadFunnelStages();
    }
  }, [isOpen, agent?.funnel_id]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-xl">
        <DialogHeader className="border-b border-white/30 pb-4 bg-white/20 backdrop-blur-sm rounded-t-xl -mx-6 -mt-6 px-6 pt-6">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <div className="p-2 bg-white/30 backdrop-blur-sm rounded-lg border border-white/40 shadow-glass">
              <Phone className="h-5 w-5 text-yellow-500" />
            </div>
            Configuração de Notificações por Estágio
          </DialogTitle>
          <p className="text-sm text-gray-700 mt-2">
            Configure telefones individuais para cada estágio do funil
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-4 space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando configurações...</p>
            </div>
          ) : funnelStages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Nenhum estágio encontrado para este funil.</p>
            </div>
          ) : (
            funnelStages
              .filter(stage => stage.title !== 'Entrada de Leads' && stage.title !== 'Em atendimento')
              .map((stage) => (
                <Card key={stage.id} className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge 
                          style={{ backgroundColor: stage.color }} 
                          className="text-white font-medium px-3 py-1"
                        >
                          {stage.title}
                        </Badge>
                        <p className="text-xs text-gray-500">Posição: {stage.order_position}</p>
                      </div>
                      
                      {/* Switch de notificação */}
                      <div className="flex items-center gap-3">
                        {stageNotifications[stage.id] ? (
                          <Bell className="h-4 w-4 text-green-600" />
                        ) : (
                          <BellOff className="h-4 w-4 text-gray-400" />
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Notificar:</span>
                          <Switch
                            checked={stageNotifications[stage.id] || false}
                            onCheckedChange={(checked) => handleStageNotificationToggle(stage.id, checked)}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Descrição do estágio */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Descrição do estágio para IA
                      </Label>
                      <Textarea
                        value={stageDescriptions[stage.id] || ''}
                        onChange={(e) => handleStageDescriptionChange(stage.id, e.target.value)}
                        placeholder={`Descreva o que acontece no estágio "${stage.title}"...`}
                        className="min-h-20 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Campo de telefone - só aparece se notificação estiver ativa */}
                    {stageNotifications[stage.id] && (
                      <div className="space-y-2 p-3 bg-green-50/50 border border-green-200/50 rounded-lg">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Phone className="h-4 w-4 text-green-600" />
                          Telefone para notificações deste estágio
                        </Label>
                        <Input
                          value={stagePhones[stage.id] || ''}
                          onChange={(e) => handlePhoneChange(stage.id, e.target.value)}
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
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        {/* Footer com botões */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/30 bg-white/10 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="px-6 h-11 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl transition-all duration-200"
          >
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-8 h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-glass hover:shadow-glass-lg transition-all duration-200 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};