import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FieldConfigModal } from "./FieldConfigModal";
import { FieldConfigModalTemp } from "./FieldConfigModalTemp";
import { FlowStepConfigModal } from "./FlowStepConfigModal";
import { FunnelConfigModal } from "./FunnelConfigModal";
import { AIAgent, FieldWithExamples, FlowStepEnhanced, PQExample } from "@/types/aiAgent";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { 
  User, 
  Target, 
  MessageSquare, 
  Building, 
  Package, 
  FileText,
  AlertTriangle, 
  ShieldX,
  Lightbulb,
  ListChecks,
  Settings,
  Plus,
  Edit,
  Trash2,
  X
} from "lucide-react";

interface EnhancedPromptConfigurationProps {
  agent?: AIAgent | null;
  promptData: {
    agent_function: string;
    agent_objective: string;
    communication_style: string;
    communication_style_examples: PQExample[];
    company_info: string;
    products_services: string;
    rules_guidelines: any[]; // JSONB - array de objetos
    prohibitions: any[]; // JSONB - array de objetos  
    client_objections: any[]; // JSONB - array de objetos com objeção+resposta
    flow: FlowStepEnhanced[];
  };
  onPromptDataChange: (field: string, value: any) => void;
  onSave: (saveContext?: { fromTab?: string; skipRedirect?: boolean }) => Promise<void>;
  onCancel: () => void;
}

export const EnhancedPromptConfiguration = ({
  agent,
  promptData,
  onPromptDataChange,
  onSave,
  onCancel
}: EnhancedPromptConfigurationProps) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<{ step: FlowStepEnhanced | null; index: number } | null>(null);
  const [newStepText, setNewStepText] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ show: boolean; index: number | null }>({ show: false, index: null });
  const [funnelConfigStatus, setFunnelConfigStatus] = useState<'not-selected' | 'ready' | 'configured'>('not-selected');
  const [forceRender, setForceRender] = useState(0);

  // MELHORADA: Função para verificar status de configuração do funil
  const checkFunnelConfigStatus = async () => {
    console.log('🔍 Verificando status de configuração do funil...');
    
    if (!agent?.funnel_id) {
      console.log('❌ Nenhum funil selecionado');
      setFunnelConfigStatus('not-selected');
      return;
    }

    console.log('📊 Funil selecionado:', agent.funnel_id);

    try {
      // Verificar se há estágios configurados com ai_stage_description
      const { data: stages, error } = await supabase
        .from('kanban_stages')
        .select('ai_stage_description, title, id')
        .eq('funnel_id', agent.funnel_id);

      if (error) {
        console.warn('⚠️ Erro ao verificar configuração do funil (provavelmente campos AI não existem ainda):', error);
        setFunnelConfigStatus('ready');
        return;
      }

      console.log(`📋 Encontrados ${stages?.length || 0} estágios no funil`);

      // Contar estágios configurados (excluindo etapas automáticas)
      const configurableStages = stages?.filter(stage => 
        stage.title !== 'Entrada de Leads' && 
        stage.title !== 'Em atendimento'
      ) || [];

      console.log(`⚙️ Estágios configuráveis: ${configurableStages.length}`);

      const configuredStages = configurableStages.filter(stage => 
        stage.ai_stage_description && stage.ai_stage_description.trim().length > 0
      );

      console.log(`✅ Estágios configurados: ${configuredStages.length}/${configurableStages.length}`);

      // Se pelo menos uma etapa configurável tem descrição, considerar configurado
      if (configuredStages.length > 0) {
        console.log('✅ Status: Configurado');
        setFunnelConfigStatus('configured');
      } else if (configurableStages.length > 0) {
        console.log('🟡 Status: Pronto para configurar');
        setFunnelConfigStatus('ready');
      } else {
        console.log('❌ Status: Nenhum estágio configurável encontrado');
        setFunnelConfigStatus('not-selected');
      }
    } catch (error) {
      console.warn('❌ Erro ao verificar status do funil:', error);
      setFunnelConfigStatus('ready');
    }
  };

  // Verificar status quando agente ou funil mudar
  useEffect(() => {
    checkFunnelConfigStatus();
  }, [agent?.funnel_id]);

  useEffect(() => {
    console.log('🔍 editingStep mudou:', editingStep);
  }, [editingStep]);

  useEffect(() => {
    console.log('🔍 showDeleteConfirm mudou:', showDeleteConfirm);
  }, [showDeleteConfirm]);

  useEffect(() => {
    console.log('🔄 forceRender mudou:', forceRender, '- Componente deve re-renderizar');
  }, [forceRender]);

  // Configurações dos campos - ATUALIZADO para nova estrutura
  const fieldConfigs = useMemo(() => [
    {
      key: 'agent_function',
      title: 'Qual a função dela?',
      icon: <User className="h-4 w-4 text-yellow-500" />,
      type: 'simple' as const,
      required: false, // REMOVIDO obrigatório
      placeholder: 'Ex: Você é um assistente de vendas especializado em produtos tecnológicos para empresas. Sua função é identificar necessidades, apresentar soluções e conduzir o cliente até o fechamento da venda.',
      value: promptData.agent_function,
      description: 'Define o papel e identidade do agente'
    },
    {
      key: 'agent_objective',
      title: 'Qual o objetivo dela?',
      icon: <Target className="h-4 w-4 text-yellow-500" />,
      type: 'simple' as const,
      required: false, // REMOVIDO obrigatório
      placeholder: 'Ex: Converter leads em vendas qualificadas, mantendo um atendimento humanizado e identificando exatamente a necessidade do cliente para oferecer a melhor solução.',
      value: promptData.agent_objective,
      description: 'Define o objetivo principal do agente'
    },
    {
      key: 'communication_style',
      title: 'Estilo de Conversa',
      icon: <MessageSquare className="h-4 w-4 text-yellow-500" />,
      type: 'with-examples' as const,
      required: false, // REMOVIDO obrigatório
      placeholder: 'Ex: Comunicação amigável, profissional, com linguagem clara e objetiva. Sempre empático e paciente.',
      value: {
        description: promptData.communication_style,
        examples: promptData.communication_style_examples
      },
      examplePlaceholder: {
        question: 'Como você se comunica com os clientes?',
        answer: 'Olá! Como posso ajudar você hoje? 😊'
      },
      description: 'Define como o agente se comunica'
    },
    {
      key: 'company_info',
      title: 'Informações sobre a Empresa',
      icon: <Building className="h-4 w-4 text-yellow-500" />,
      type: 'simple' as const,
      required: false,
      placeholder: 'Ex: Somos uma empresa de tecnologia com 10 anos de mercado, especializada em soluções para pequenas e médias empresas...',
      value: promptData.company_info,
      description: 'Informações sobre sua empresa'
    },
    {
      key: 'products_services',
      title: 'Explique seus produtos e serviços',
      icon: <Package className="h-4 w-4 text-yellow-500" />,
      type: 'simple' as const, // MUDADO de 'with-examples' para 'simple'
      required: false,
      placeholder: 'Ex: Oferecemos sistemas de gestão, automação comercial e consultoria em tecnologia...',
      value: promptData.products_services,
      description: 'Produtos e serviços da empresa'
    },
    {
      key: 'rules_guidelines',
      title: 'Regras/Diretrizes para o Agente',
      icon: <FileText className="h-4 w-4 text-yellow-500" />,
      type: 'text-list' as const, // Modo de adição de texto como exemplos
      required: false,
      placeholder: 'Ex: Sempre confirme dados importantes, mantenha o foco no cliente, seja transparente sobre limitações...',
      value: promptData.rules_guidelines || [],
      itemPlaceholder: 'Ex: Sempre confirmar dados do cliente antes de prosseguir',
      description: 'Regras que o agente deve seguir'
    },
    {
      key: 'prohibitions',
      title: 'Proibições para o Agente',
      icon: <ShieldX className="h-4 w-4 text-yellow-500" />,
      type: 'text-list' as const, // Modo de adição de texto como exemplos
      required: false,
      placeholder: 'Ex: Não forneça informações sobre preços sem consultar um vendedor, não faça promessas de desconto...',
      value: promptData.prohibitions || [],
      itemPlaceholder: 'Ex: Nunca dar descontos sem autorização',
      description: 'O que o agente NÃO pode fazer'
    },
    {
      key: 'client_objections',
      title: 'Objeções de Clientes',
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      type: 'objections-list' as const, // Tipo para objeção + resposta
      required: false,
      placeholder: 'Ex: Como tratar objeções sobre preço, tempo de implantação, comparação com concorrentes...',
      value: promptData.client_objections || [],
      description: 'Como lidar com objeções comuns'
    },
    {
      key: 'flow',
      title: 'Passo a passo do atendimento',
      icon: <ListChecks className="h-4 w-4 text-yellow-500" />,
      type: 'flow-steps' as const, // Tipo especial para fluxo numerado
      required: false,
      placeholder: '',
      value: promptData.flow || [],
      description: 'Defina o fluxo que o agente deve seguir durante o atendimento'
    },
    {
      key: 'funnel_stages',
      title: 'Configuração do Funil',
      icon: <Target className="h-4 w-4 text-yellow-500" />,
      type: 'funnel-config' as const, // Volta ao tipo original
      required: false,
      placeholder: '',
      value: null, // Será calculado dinamicamente
      description: 'Configure os estágios do funil e notificações'
    }
  ], [promptData, funnelConfigStatus]);

  // fieldConfigs agora é reativo às mudanças do promptData via useMemo

  const handleFieldSave = async (fieldKey: string, value: any) => {
    console.log('💾 EnhancedPrompt - handleFieldSave chamado:', { fieldKey, value });
    
    try {
      // Para campos com exemplos, atualizar ambos os campos de uma vez usando batch updates
      if (typeof value === 'object' && value.description !== undefined && value.examples !== undefined) {
        console.log('📝 Campo com exemplos detectado - atualizando description e examples juntos');
        
        // Usar uma única função que atualiza ambos os campos atomicamente
        // IMPORTANTE: Passar false para isInternalLoad para marcar como mudança do usuário
        onPromptDataChange(fieldKey, value.description);
        onPromptDataChange(`${fieldKey}_examples`, value.examples);
      } else if (fieldKey === 'flow' && Array.isArray(value)) {
        // Para o campo flow, converter array de strings para array de objetos FlowStepEnhanced
        console.log('📝 Campo flow detectado - convertendo para formato FlowStepEnhanced');
        const flowSteps = value.map((content: string, index: number) => ({
          step: index + 1,
          title: `Passo ${index + 1}`,
          content: content,
          isExpanded: false
        }));
        onPromptDataChange(fieldKey, flowSteps);
      } else {
        console.log('📝 Campo simples detectado - atualizando valor único');
        // IMPORTANTE: Passar false para isInternalLoad para marcar como mudança do usuário
        onPromptDataChange(fieldKey, value);
      }
      
      console.log('📝 Estado local atualizado, salvando no banco imediatamente...');
      
      // Calcular o novo estado que será passado para o salvamento
      let freshPromptData = { ...promptData };
      if (fieldKey === 'funnel_stages') {
        freshPromptData = { ...freshPromptData, [fieldKey]: value.stages } as any;
      } else if (value && typeof value === 'object' && 'description' in value) {
        freshPromptData = { ...freshPromptData, [fieldKey]: value.description, [`${fieldKey}_examples`]: value.examples || [] } as any;
      } else if (fieldKey === 'flow' && Array.isArray(value)) {
        // Para o campo flow, garantir que é salvo como array de objetos
        const flowSteps = value.map((content: string, index: number) => ({
          id: `step_${index + 1}`,
          description: content,
          examples: [],
          order: index + 1
        }));
        freshPromptData = { ...freshPromptData, [fieldKey]: flowSteps };
      } else {
        freshPromptData = { ...freshPromptData, [fieldKey]: value };
      }
      
      console.log('📊 Dados frescos calculados para salvamento:', {
        campo: fieldKey,
        valorNovo: freshPromptData[fieldKey] ? `PREENCHIDO (${Array.isArray(freshPromptData[fieldKey]) ? freshPromptData[fieldKey].length : freshPromptData[fieldKey].length} items/chars)` : 'VAZIO'
      });
      
      // Salvar imediatamente com os dados frescos
      await onSave({ fromTab: 'prompt', skipRedirect: true }, freshPromptData);
      console.log('✅ EnhancedPrompt - Dados persistidos no banco com sucesso');
      
      // Se foi configuração de funil, recarregar status
      if (fieldKey === 'funnel_stages') {
        console.log('🔄 Recarregando status do funil após salvamento');
        await checkFunnelConfigStatus();
      }
    } catch (error) {
      console.error('❌ Erro ao persistir no banco:', error);
      throw error; // Re-throw para que o modal saiba que houve erro
    }
  };

  const handleStepSave = async (step: FlowStepEnhanced) => {
    console.log('📋 EnhancedPrompt - handleStepSave chamado:', { step, editingStep });
    
    try {
      const newFlow = [...promptData.flow];
      
      if (editingStep && editingStep.step) {
        // Editando passo existente
        newFlow[editingStep.index] = step;
        console.log('✏️ Editando passo existente no índice:', editingStep.index);
      } else {
        // Adicionando novo passo
        newFlow.push(step);
        console.log('➕ Adicionando novo passo');
      }
      
      // Atualizar estado e salvar imediatamente
      onPromptDataChange('flow', newFlow);
      setEditingStep(null);
      
      console.log('📝 Fluxo atualizado, salvando no banco imediatamente...');
      
      // Salvar imediatamente - sem timeout desnecessário
      await onSave();
      console.log('✅ EnhancedPrompt - Fluxo persistido no banco com sucesso');
    } catch (error) {
      console.error('❌ Erro ao persistir fluxo no banco:', error);
      throw error; // Re-throw para que o componente saiba que houve erro
    }
  };

  const handleStepDelete = (index: number) => {
    console.log('🗑️ handleStepDelete chamado com índice:', index);
    console.log('🗑️ setShowDeleteConfirm será chamado com:', { show: true, index });
    setShowDeleteConfirm(prev => {
      console.log('🗑️ CALLBACK setShowDeleteConfirm - anterior:', prev, 'novo:', { show: true, index });
      return { show: true, index };
    });
    setForceRender(prev => prev + 1); // Forçar re-render
  };

  const handleConfirmDelete = async () => {
    const { index } = showDeleteConfirm;
    if (index === null) return;
    
    console.log('🗑️ handleConfirmDelete chamado para índice:', index);
    console.log('📊 Flow atual tem', promptData.flow.length, 'passos');
    console.log('🎯 Passo a ser removido:', promptData.flow[index]?.description);
    
    try {
      const newFlow = promptData.flow.filter((_, i) => i !== index);
      console.log('📝 Novo flow terá', newFlow.length, 'passos');
      
      onPromptDataChange('flow', newFlow);
      
      console.log('📝 Estado local atualizado, salvando no banco imediatamente...');
      
      // Salvar imediatamente após remoção - passar contexto para evitar redirecionamento
      await onSave({ fromTab: 'objectives', skipRedirect: true });
      
      toast.success('Passo removido com sucesso');
      console.log('✅ Passo removido e salvo no banco com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar remoção no banco:', error);
      console.error('📊 Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : null
      });
      toast.error('Erro ao remover passo', {
        description: 'Não foi possível salvar a alteração. Tente novamente.',
      });
    } finally {
      setShowDeleteConfirm({ show: false, index: null });
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm({ show: false, index: null });
  };

  const handleAddStep = () => {
    if (!newStepText.trim()) return;
    
    console.log('🚀 INICIANDO ADIÇÃO DE PASSO INLINE');
    console.log('📝 Texto do passo:', newStepText);
    console.log('📊 Fluxo atual tem', promptData.flow.length, 'passos');
    
    const newStep: FlowStepEnhanced = {
      id: `step_${Date.now()}`,
      description: newStepText.trim(),
      examples: [],
      order: promptData.flow.length + 1
    };
    
    console.log('📋 Novo passo criado:', newStep);
    
    const newFlow = [...promptData.flow, newStep];
    console.log('📚 Novo fluxo terá', newFlow.length, 'passos');
    
    onPromptDataChange('flow', newFlow);
    console.log('✅ Estado local atualizado');
    
    // Limpar campo
    setNewStepText("");
    console.log('🧹 Campo limpo');
    console.log('🎯 ADIÇÃO DE PASSO CONCLUÍDA - MODAL DEVE PERMANECER ABERTO');
  };

  const getFieldStatus = (config: any) => {
    if (config.type === 'simple') {
      return config.value ? '✅' : '❌';
    } else if (config.type === 'with-examples') {
      // Campos com exemplos (communication_style)
      const hasDescription = config.value.description;
      const hasExamples = config.value.examples.length > 0;
      return hasDescription ? (hasExamples ? '✅' : '🟡') : '❌';
    } else if (config.type === 'text-list') {
      // Lista de textos simples (rules_guidelines, prohibitions)
      return Array.isArray(config.value) && config.value.length > 0 ? '✅' : '❌';
    } else if (config.type === 'objections-list') {
      // Lista de objeções com resposta (client_objections)
      return Array.isArray(config.value) && config.value.length > 0 ? '✅' : '❌';
    } else if (config.type === 'flow-steps') {
      // Fluxo passo a passo numerado (flow)
      return Array.isArray(config.value) && config.value.length > 0 ? '✅' : '❌';
    } else if (config.type === 'funnel-config') {
      // Configuração do funil (volta ao original)
      switch (funnelConfigStatus) {
        case 'configured': return '✅';
        case 'ready': return '🟡';
        case 'not-selected': return '❌';
        default: return '❌';
      }
    } else {
      return '❌';
    }
  };

  console.log('🔥 RENDER EnhancedPromptConfiguration - Estados atuais:', {
    editingStep: !!editingStep,
    showDeleteConfirm: showDeleteConfirm.show,
    forceRender
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldConfigs.map((config) => (
          <Card 
            key={config.key}
            className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl hover:bg-white/50 transition-all duration-200 cursor-pointer"
            onClick={() => setActiveModal(config.key)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-800">
                {config.icon}
                <span className="flex-1">{config.title}</span>
                {config.required && <span className="text-red-500 text-xs">*</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-3">{config.description}</p>
              
              {/* Status visual */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getFieldStatus(config)}</span>
                <span className="text-xs font-medium text-gray-700">
                  {config.type === 'simple' 
                    ? (config.value ? 'Configurado' : 'Não configurado')
                    : config.type === 'with-examples'
                      ? (config.value?.description || config.value?.examples?.length > 0 ? 'Configurado' : 'Não configurado')
                    : config.type === 'text-list' || config.type === 'objections-list' || config.type === 'flow-steps'
                      ? (Array.isArray(config.value) && config.value.length > 0 ? 'Configurado' : 'Não configurado')
                    : config.type === 'funnel-config'
                      ? (funnelConfigStatus === 'configured' ? 'Configurado' : 
                         funnelConfigStatus === 'ready' ? 'Pronto para configurar' : 'Não configurado')
                      : 'Não configurado'
                  }
                </span>
              </div>
              
              {/* Prévia do conteúdo */}
              <div className="space-y-1 mb-3">
                {config.type === 'simple' ? (
                  <div className="text-xs text-gray-700 bg-white/30 rounded p-2 min-h-[2rem] flex items-center">
                    {config.value ? String(config.value).substring(0, 80) + (String(config.value).length > 80 ? '...' : '') : 'Clique em "Configurar" para adicionar'}
                  </div>
                ) : config.type === 'with-examples' ? (
                    <div className="space-y-1">
                      <div className="text-xs text-gray-700 bg-white/30 rounded p-2">
                        {config.value?.description ? String(config.value.description).substring(0, 60) + (String(config.value.description).length > 60 ? '...' : '') : 'Sem descrição'}
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        {config.value?.examples?.length || 0} exemplos configurados
                      </p>
                    </div>
                ) : config.type === 'text-list' ? (
                    <div className="text-xs text-gray-700 bg-white/30 rounded p-2 min-h-[2rem] flex items-center">
                      {Array.isArray(config.value) && config.value.length > 0 
                        ? `${config.value.length} item${config.value.length !== 1 ? 'ns' : ''} configurado${config.value.length !== 1 ? 's' : ''}`
                        : 'Clique em "Configurar" para adicionar itens'}
                    </div>
                ) : config.type === 'objections-list' ? (
                    <div className="text-xs text-gray-700 bg-white/30 rounded p-2 min-h-[2rem] flex items-center">
                      {Array.isArray(config.value) && config.value.length > 0 
                        ? `${config.value.length} objeção${config.value.length !== 1 ? 'ões' : ''} configurada${config.value.length !== 1 ? 's' : ''}`
                        : 'Clique em "Configurar" para adicionar objeções'}
                    </div>
                ) : config.type === 'flow-steps' ? (
                    <div className="text-xs text-gray-700 bg-white/30 rounded p-2 min-h-[2rem] flex items-center">
                      {Array.isArray(config.value) && config.value.length > 0 
                        ? `${config.value.length} passo${config.value.length !== 1 ? 's' : ''} configurado${config.value.length !== 1 ? 's' : ''}`
                        : 'Clique em "Configurar" para adicionar passos'}
                    </div>
                ) : config.type === 'funnel-config' ? (
                    <div className={`text-xs rounded p-3 min-h-[3rem] flex items-center gap-2 ${
                      funnelConfigStatus === 'configured' ? 'bg-green-50/80 text-green-800 border border-green-200/50' :
                      funnelConfigStatus === 'ready' ? 'bg-yellow-50/80 text-yellow-800 border border-yellow-200/50' :
                      'bg-gray-50/80 text-gray-600 border border-gray-200/50'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        funnelConfigStatus === 'configured' ? 'bg-green-500' :
                        funnelConfigStatus === 'ready' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`}></div>
                      <div className="flex-1">
                        {funnelConfigStatus === 'configured' ? (
                          <div className="font-medium">✅ Estágios configurados</div>
                        ) : funnelConfigStatus === 'ready' ? (
                          <div className="font-medium">🎯 Pronto para configurar</div>
                        ) : (
                          <div className="font-medium">📋 Funil não selecionado</div>
                        )}
                      </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-700 bg-white/30 rounded p-2 min-h-[2rem] flex items-center">
                      Tipo não reconhecido
                    </div>
                )}
                </div>
                
                {/* Botão configurar */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-yellow-100 border-yellow-300 hover:bg-yellow-200 text-yellow-800 font-medium text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal(config.key);
                  }}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Configurar Campo
                </Button>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Modais de configuração */}
      {fieldConfigs.filter(config => 
        config.type === 'simple' || 
        config.type === 'with-examples' ||
        config.type === 'text-list' ||
        config.type === 'objections-list' ||
        config.type === 'flow-steps' ||
        config.type === 'funnel-config'
      ).map((config) => {
        // Usar modal temporário APENAS para agent_function como teste
        const ModalComponent = config.key === 'agent_function' ? FieldConfigModalTemp : FieldConfigModal;
        
        return (
          <ModalComponent
            key={config.key}
            isOpen={activeModal === config.key}
            onClose={() => setActiveModal(null)}
            onSave={(value) => handleFieldSave(config.key, value)}
            title={config.title}
            fieldKey={config.key}
            icon={config.icon}
            type={config.type}
            required={config.required}
            simpleValue={config.type === 'simple' ? config.value : undefined}
            placeholder={config.placeholder}
            fieldWithExamples={config.type === 'with-examples' ? config.value : undefined}
            examplePlaceholder={config.examplePlaceholder}
            textListValue={config.type === 'text-list' ? config.value : undefined}
            objectionsValue={config.type === 'objections-list' ? config.value : undefined}
            flowStepsValue={config.type === 'flow-steps' ? config.value?.map((step: any) => step.content || step) : undefined}
            funnelConfigValue={config.type === 'funnel-config' ? config.value : undefined}
            agent={agent}
          />
        );
      })}


      {/* Modal de configuração de passos do fluxo */}
      {editingStep !== null && (
        <FlowStepConfigModal
          key={`flow-step-modal-${editingStep?.index || 'new'}-${forceRender}`}
          isOpen={true}
          onClose={() => {
            console.log('🚪 FlowStepConfigModal - Fechando modal');
            setEditingStep(null);
          }}
          onSave={async (step: FlowStepEnhanced) => {
            console.log('💾 FlowStepConfigModal - Salvando passo:', step);
            await handleStepSave(step);
            setEditingStep(null);
          }}
          step={editingStep?.step || null}
          stepNumber={editingStep ? editingStep.index + 1 : 1}
        />
      )}
      {/* Debug log moved to useEffect or outside JSX */}

      {/* Botões de ação - BUG 2 FIX: Remover botão "Salvar Configuração" redundante */}
      <div className="flex justify-end gap-2 pt-4 border-t border-white/30">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="px-4 h-9 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-lg text-sm"
        >
          Fechar
        </Button>
        {/* Informação sobre salvamento automático */}
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50/80 px-3 py-2 rounded-lg">
          <span className="text-green-600">✅</span>
          <span>Todas as configurações são salvas automaticamente</span>
        </div>
      </div>

      {/* Modal de confirmação para deletar passo */}
      {console.log('🔍 DeleteConfirmModal renderizando:', showDeleteConfirm.show)}
      {showDeleteConfirm.show && (
        <Dialog 
          key={`delete-confirm-modal-${showDeleteConfirm.index || 'none'}-${forceRender}`}
          open={true} 
          onOpenChange={() => {
            console.log('🗑️ Modal de confirmação fechando');
            setShowDeleteConfirm({ show: false, index: null });
          }}
        >
        <DialogContent className="max-w-md bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-xl">
          <DialogHeader className="border-b border-white/30 pb-3 bg-white/20 backdrop-blur-sm rounded-t-xl -mx-6 -mt-6 px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <div className="p-2 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-500/30">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Confirmar exclusão
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              Tem certeza que deseja excluir este passo? Esta ação não pode ser desfeita.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/30 bg-white/10 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancelDelete}
              className="px-4 h-10 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-lg transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              className="px-4 h-10 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200"
            >
              Excluir passo
            </Button>
          </div>
        </DialogContent>
        </Dialog>
      )}
    </div>
  );
};