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
import { AIAgent, FunnelStageConfig } from "@/types/aiAgent";
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
  is_won: boolean;
  is_lost: boolean;
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

      // Buscar estágios do funil (INCLUINDO is_won e is_lost para organização)
      const { data: stagesData, error: stagesError } = await supabase
        .from('kanban_stages')
        .select(`
          id, 
          title, 
          color, 
          order_position,
          is_won,
          is_lost,
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
            .select('id, title, color, order_position, is_won, is_lost, funnel_id')
            .eq('funnel_id', funnelId)
            .order('order_position', { ascending: true });

          if (basicStagesError) throw basicStagesError;

          // Mapear para formato esperado com campos AI vazios
          const stagesWithDefaults = basicStagesData?.map(stage => ({
            ...stage,
            is_won: stage.is_won || false,
            is_lost: stage.is_lost || false,
            ai_stage_description: '',
            ai_notify_enabled: false,
            notify_phone: ''
          })) || [];

          // APLICAR ORGANIZAÇÃO FIXA aos estágios básicos também
          const organizedBasicStages = organizeStagesInFixedOrder(stagesWithDefaults);
          setFunnelStages(organizedBasicStages);
          console.log('✅ Estágios básicos carregados e organizados:', organizedBasicStages.length);
        } else {
          throw stagesError;
        }
      } else {
        console.log('✅ Estágios carregados:', stagesData?.length || 0);
        
        // APLICAR ORGANIZAÇÃO FIXA aos estágios
        const organizedStages = organizeStagesInFixedOrder(stagesData || []);
        setFunnelStages(organizedStages);
      }

      // NOVO: Tentar carregar dados consolidados do ai_agents.funnel_configuration primeiro
      let consolidatedDescriptions: Record<string, string> = {};
      
      try {
        console.log('🔍 Tentando carregar dados consolidados do ai_agents...');
        const { data: agentData, error: agentError } = await supabase
          .from('ai_agents')
          .select('funnel_configuration')
          .eq('id', agent?.id || '')
          .single();

        if (!agentError && agentData?.funnel_configuration && Array.isArray(agentData.funnel_configuration)) {
          console.log('✅ Dados consolidados encontrados:', agentData.funnel_configuration);
          agentData.funnel_configuration.forEach((config: FunnelStageConfig) => {
            consolidatedDescriptions[config.stage_id] = config.description || '';
          });
          console.log('📋 Descrições consolidadas mapeadas:', Object.keys(consolidatedDescriptions).length);
        }
      } catch (error) {
        console.log('⚠️ Erro ao carregar dados consolidados (fallback para kanban_stages):', error);
      }

      // Mapear dados para o estado local (com prioridade para dados consolidados)
      const descriptions: Record<string, string> = {};
      const notifications: Record<string, boolean> = {};
      const phones: Record<string, string> = {};
      
      stagesData?.forEach(stage => {
        // Priorizar descrição consolidada se existir, caso contrário usar da kanban_stages
        descriptions[stage.id] = consolidatedDescriptions[stage.id] || stage.ai_stage_description || '';
        notifications[stage.id] = stage.ai_notify_enabled || false;
        phones[stage.id] = stage.notify_phone ? formatPhoneNumber(stage.notify_phone) : '';
      });

      console.log('📊 Estado final mapeado:', { 
        descriptions: Object.keys(descriptions).length,
        notifications: Object.keys(notifications).length, 
        phones: Object.keys(phones).length 
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
    
    // Se for link de grupo, retornar sem formatação
    if (value.includes('chat.whatsapp.com') || value.includes('wa.me/') || value.includes('whatsapp.com/')) {
      console.log('🔗 Link de grupo detectado, sem formatação');
      return value;
    }
    
    // Se já estiver no formato VPS (ID@g.us), não formatar
    if (value.match(/^[A-Za-z0-9]+@g\.us$/)) {
      console.log('📋 Formato VPS detectado, sem formatação');
      return value;
    }
    
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

  // NOVA FUNÇÃO: Extrair ID do grupo WhatsApp e converter para formato VPS
  const extractGroupIdFromLink = (link: string): string => {
    console.log('🔗 Extraindo ID do grupo do link:', link);
    
    // Padrão para links do WhatsApp: https://chat.whatsapp.com/CODIGO?parametros
    const match = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
    
    if (match && match[1]) {
      const groupId = match[1];
      const formattedId = `${groupId}@g.us`;
      console.log('✅ ID do grupo extraído:', formattedId);
      return formattedId;
    }
    
    console.log('❌ Não foi possível extrair ID do grupo');
    return link; // Se não conseguir extrair, retorna o link original
  };

  const formatPhoneForDatabase = (value: string) => {
    // Se for link de grupo, extrair ID e converter para formato VPS
    if (value.includes('chat.whatsapp.com') || value.includes('wa.me/') || value.includes('whatsapp.com/')) {
      return extractGroupIdFromLink(value);
    }
    
    // Formatação normal para números de telefone
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
    // Verificar se é um link de grupo do WhatsApp
    if (phone.includes('chat.whatsapp.com') || phone.includes('wa.me/') || phone.includes('whatsapp.com/')) {
      return true; // Links de grupo são válidos
    }
    
    // Verificar se já está no formato ID@g.us (formato VPS)
    if (phone.match(/^[A-Za-z0-9]+@g\.us$/)) {
      return true; // Formato VPS válido
    }
    
    // Validação normal para números de telefone
    const numbers = phone.replace(/\D/g, '');
    // Deve ter pelo menos 11 dígitos (DDD + número) ou 13 com código do país (55)
    return numbers.length >= 11;
  };

  const handleStagePhoneChange = (stageId: string, value: string) => {
    console.log('📱 handleStagePhoneChange chamado:', { stageId, value });
    
    // Se for link de grupo, converter automaticamente para formato VPS
    if (value.includes('chat.whatsapp.com') || value.includes('wa.me/') || value.includes('whatsapp.com/')) {
      console.log('🔗 Link de grupo detectado, convertendo para formato VPS...');
      const vpsFormat = extractGroupIdFromLink(value);
      console.log('✅ Formato VPS:', vpsFormat);
      setStagePhones(prev => ({ ...prev, [stageId]: vpsFormat }));
      
      // Mostrar toast informativo
      if (vpsFormat.includes('@g.us')) {
        toast.success('Link convertido!', {
          description: `Formato VPS: ${vpsFormat}`,
          duration: 3000,
        });
      }
      return;
    }
    
    // Se já estiver no formato VPS, manter como está
    if (value.match(/^[A-Za-z0-9]+@g\.us$/)) {
      console.log('📋 Formato VPS detectado, mantendo como está');
      setStagePhones(prev => ({ ...prev, [stageId]: value }));
      return;
    }
    
    // Formatação normal para números
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
        toast.error('Contato inválido', {
          description: `Digite um telefone válido (mínimo 11 dígitos) ou link de grupo para o estágio "${stage.title}"`,
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      console.log('💾 NOVO FLUXO: Salvando em DOIS locais - kanban_stages + ai_agents.funnel_configuration...');

      // 1. PREPARAR DADOS para kanban_stages (INCLUINDO LIMPEZA de estágios fixos)
      const stageUpdates = funnelStages.map(stage => {
        const stageType = getStageType(stage);
        
        // LIMPAR descrições para estágios automáticos e finais
        const shouldClearDescription = stageType === 'automatic' || stageType === 'won' || stageType === 'lost';
        
        return {
          id: stage.id,
          ai_stage_description: shouldClearDescription ? '' : (stageDescriptions[stage.id] || ''),
          ai_notify_enabled: stageNotifications[stage.id] || false,
          notify_phone: (stageNotifications[stage.id] && stagePhones[stage.id]) 
            ? formatPhoneForDatabase(stagePhones[stage.id]) 
            : '',
        };
      });

      // 2. PREPARAR DADOS para ai_agents.funnel_configuration (JSONB consolidado COM LIMPEZA)
      const funnelConfiguration: FunnelStageConfig[] = funnelStages
        .map(stage => {
          const stageType = getStageType(stage);
          const shouldClearDescription = stageType === 'automatic' || stageType === 'won' || stageType === 'lost';
          
          return {
            stage_id: stage.id,
            order: stage.order_position,
            name: stage.title,
            description: shouldClearDescription ? '' : (stageDescriptions[stage.id] || '')
          };
        });

      console.log('📝 Dados kanban_stages (com limpeza):', stageUpdates.map(u => {
        const stage = funnelStages.find(s => s.id === u.id);
        const stageType = stage ? getStageType(stage) : 'unknown';
        return {
          title: stage?.title || 'unknown',
          type: stageType,
          ai_stage_description: u.ai_stage_description ? 'PREENCHIDO' : 'LIMPO',
          ai_notify_enabled: u.ai_notify_enabled,
          notify_phone: u.notify_phone ? 'PREENCHIDO' : 'VAZIO'
        };
      }));

      console.log('📊 Configuração consolidada (com limpeza):', funnelConfiguration.map(c => ({
        name: c.name,
        description: c.description ? 'PREENCHIDO' : 'LIMPO'
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

      // 3. SALVAR CONSOLIDADO na tabela ai_agents.funnel_configuration
      console.log('💾 ETAPA 2: Salvando configuração consolidada na ai_agents...');
      console.log('📊 Dados JSONB para funnel_configuration:', funnelConfiguration);

      const { error: agentError } = await supabase
        .from('ai_agents')
        .update({
          funnel_configuration: funnelConfiguration,
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      if (agentError) {
        console.error('❌ Erro ao salvar na ai_agents:', agentError);
        toast.error('Erro ao salvar configuração consolidada', {
          description: 'As configurações dos estágios foram salvas, mas houve erro na consolidação',
          duration: 4000,
        });
        // Não falhar completamente, pois os estágios foram salvos
      } else {
        console.log('✅ Configuração consolidada salva na ai_agents com sucesso!');
      }

      toast.success('Configuração do funil salva com sucesso', {
        description: '💾 Dados salvos em kanban_stages + ai_agents.funnel_configuration',
        duration: 3000,
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

  // NOVA FUNÇÃO: Organizar estágios na ordem fixa
  const organizeStagesInFixedOrder = (stages: FunnelStage[]) => {
    console.log('🔄 Organizando estágios na ordem fixa...');
    console.log('📊 Estágios recebidos:', stages.map(s => ({ 
      title: s.title, 
      order: s.order_position, 
      is_won: s.is_won, 
      is_lost: s.is_lost 
    })));

    // Definir categorias de estágios
    const entradaStage = stages.find(s => s.title === 'Entrada de Leads');
    const atendimentoStage = stages.find(s => s.title === 'Em atendimento');
    const ganhosStages = stages.filter(s => s.is_won === true);
    const perdidosStages = stages.filter(s => s.is_lost === true);
    
    console.log('📋 Categorização:', {
      entrada: entradaStage ? entradaStage.title : 'NÃO ENCONTRADO',
      atendimento: atendimentoStage ? atendimentoStage.title : 'NÃO ENCONTRADO', 
      ganhos: ganhosStages.map(s => s.title),
      perdidos: perdidosStages.map(s => s.title)
    });
    
    // Estágios personalizados (não são entrada, atendimento, ganhos ou perdidos)
    const personalizadosStages = stages.filter(s => 
      s.title !== 'Entrada de Leads' && 
      s.title !== 'Em atendimento' && 
      !s.is_won && 
      !s.is_lost
    ).sort((a, b) => a.order_position - b.order_position);

    // Montar ordem final
    const organizedStages: FunnelStage[] = [];
    
    if (entradaStage) organizedStages.push(entradaStage);
    if (atendimentoStage) organizedStages.push(atendimentoStage);
    organizedStages.push(...personalizadosStages);
    organizedStages.push(...ganhosStages);
    organizedStages.push(...perdidosStages);

    console.log('✅ Estágios organizados:', organizedStages.map(s => ({ 
      title: s.title, 
      type: s.title === 'Entrada de Leads' || s.title === 'Em atendimento' ? 'AUTOMÁTICO' :
            s.is_won ? 'GANHO' : s.is_lost ? 'PERDIDO' : 'PERSONALIZADO'
    })));

    return organizedStages;
  };

  // NOVA FUNÇÃO: Identificar tipo do estágio
  const getStageType = (stage: FunnelStage): 'automatic' | 'custom' | 'won' | 'lost' => {
    if (stage.title === 'Entrada de Leads' || stage.title === 'Em atendimento') {
      return 'automatic';
    } else if (stage.is_won) {
      return 'won';
    } else if (stage.is_lost) {
      return 'lost';  
    } else {
      return 'custom';
    }
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
                      const stageType = getStageType(stage);
                      
                      // ESTÁGIOS AUTOMÁTICOS: Entrada de Leads e Em atendimento
                      if (stageType === 'automatic') {
                        return (
                          <div 
                            key={stage.id}
                            className="p-4 bg-green-50/80 backdrop-blur-sm border border-green-200/60 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                  style={{ backgroundColor: stage.color || '#4ade80' }}
                                >
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                                    {stage.title === 'Entrada de Leads' ? '🎯' : '👋'} {stage.title}
                                  </h4>
                                  <p className="text-xs text-green-600">✅ Configuração automática - A IA já entende este estágio</p>
                                </div>
                              </div>
                              <div className="text-green-600 font-medium">
                                Automático
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // ESTÁGIOS GANHOS E PERDIDOS: Sem configuração de descrição
                      if (stageType === 'won' || stageType === 'lost') {
                        return (
                          <div 
                            key={stage.id}
                            className={`p-4 backdrop-blur-sm border rounded-lg ${
                              stageType === 'won' 
                                ? 'bg-blue-50/80 border-blue-200/60' 
                                : 'bg-red-50/80 border-red-200/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                  style={{ backgroundColor: stage.color || (stageType === 'won' ? '#3b82f6' : '#ef4444') }}
                                >
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className={`font-semibold flex items-center gap-2 ${
                                    stageType === 'won' ? 'text-blue-800' : 'text-red-800'
                                  }`}>
                                    {stageType === 'won' ? '🏆' : '💔'} {stage.title}
                                  </h4>
                                  <p className={`text-xs ${
                                    stageType === 'won' ? 'text-blue-600' : 'text-red-600'
                                  }`}>
                                    ✅ A IA já entende este estágio
                                  </p>
                                </div>
                              </div>
                              <div className={`font-medium ${
                                stageType === 'won' ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {stageType === 'won' ? 'Ganho' : 'Perdido'}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // ESTÁGIOS PERSONALIZADOS: Com configuração completa
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
                              📱 Telefone ou Link de Grupo (auto-converte para VPS)
                            </Label>
                            <Input
                              value={stagePhones[stage.id] || ''}
                              onChange={(e) => handleStagePhoneChange(stage.id, e.target.value)}
                              placeholder="55 (62) 99999-9999 ou https://chat.whatsapp.com/... (→ ID@g.us)"
                              className="bg-white/60 backdrop-blur-sm border border-green-300/50 focus:border-green-500 rounded-lg"
                            />
                            {stagePhones[stage.id] && !validatePhone(stagePhones[stage.id]) && (
                              <div className="flex items-center gap-2 text-xs text-red-600">
                                <AlertCircle className="h-3 w-3" />
                                Digite um telefone válido (mínimo 11 dígitos) ou link de grupo do WhatsApp
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