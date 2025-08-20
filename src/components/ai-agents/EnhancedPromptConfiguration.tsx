import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FieldConfigModal } from "./FieldConfigModal";
import { FlowStepConfigModal } from "./FlowStepConfigModal";
import { FunnelConfigModal } from "./FunnelConfigModal";
import { AIAgent, FieldWithExamples, FlowStepEnhanced, PQExample } from "@/types/aiAgent";
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
    products_services_examples: PQExample[];
    rules_guidelines: string;
    rules_guidelines_examples: PQExample[];
    prohibitions: string;
    prohibitions_examples: PQExample[];
    client_objections: string;
    client_objections_examples: PQExample[];
    phrase_tips: string;
    phrase_tips_examples: PQExample[];
    flow: FlowStepEnhanced[];
  };
  onPromptDataChange: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  focusObjectives?: boolean;
}

export const EnhancedPromptConfiguration = ({
  agent,
  promptData,
  onPromptDataChange,
  onSave,
  onCancel,
  focusObjectives = false
}: EnhancedPromptConfigurationProps) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<{ step: FlowStepEnhanced | null; index: number } | null>(null);
  const [newStepText, setNewStepText] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ show: boolean; index: number | null }>({ show: false, index: null });

  // Configurações dos campos
  const fieldConfigs = [
    {
      key: 'agent_function',
      title: 'Qual a função dela?',
      icon: <User className="h-4 w-4 text-yellow-500" />,
      type: 'simple' as const,
      required: true,
      placeholder: 'Ex: Você é um assistente de vendas especializado em produtos tecnológicos para empresas. Sua função é identificar necessidades, apresentar soluções e conduzir o cliente até o fechamento da venda.',
      value: promptData.agent_function,
      description: 'Define o papel e identidade do agente'
    },
    {
      key: 'agent_objective',
      title: 'Qual o objetivo dela?',
      icon: <Target className="h-4 w-4 text-yellow-500" />,
      type: 'simple' as const,
      required: true,
      placeholder: 'Ex: Converter leads em vendas qualificadas, mantendo um atendimento humanizado e identificando exatamente a necessidade do cliente para oferecer a melhor solução.',
      value: promptData.agent_objective,
      description: 'Define o objetivo principal do agente'
    },
    {
      key: 'communication_style',
      title: 'Estilo de Conversa',
      icon: <MessageSquare className="h-4 w-4 text-yellow-500" />,
      type: 'with-examples' as const,
      required: true,
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
      type: 'with-examples' as const,
      required: false,
      placeholder: 'Ex: Oferecemos sistemas de gestão, automação comercial e consultoria em tecnologia...',
      value: {
        description: promptData.products_services,
        examples: promptData.products_services_examples
      },
      examplePlaceholder: {
        question: 'Quais produtos vocês oferecem?',
        answer: 'Oferecemos três principais soluções: Sistema ERP, CRM e Automação de Marketing...'
      },
      description: 'Produtos e serviços da empresa'
    },
    {
      key: 'rules_guidelines',
      title: 'Regras/Diretrizes para o Agente',
      icon: <FileText className="h-4 w-4 text-yellow-500" />,
      type: 'with-examples' as const,
      required: false,
      placeholder: 'Ex: Sempre confirme dados importantes, mantenha o foco no cliente, seja transparente sobre limitações...',
      value: {
        description: promptData.rules_guidelines,
        examples: promptData.rules_guidelines_examples
      },
      examplePlaceholder: {
        question: 'Qual sua política de atendimento?',
        answer: 'Seguimos sempre a política de transparência total e foco na necessidade real do cliente.'
      },
      description: 'Regras que o agente deve seguir'
    },
    {
      key: 'prohibitions',
      title: 'Proibições para o Agente',
      icon: <ShieldX className="h-4 w-4 text-yellow-500" />,
      type: 'with-examples' as const,
      required: false,
      placeholder: 'Ex: Não forneça informações sobre preços sem consultar um vendedor, não faça promessas de desconto...',
      value: {
        description: promptData.prohibitions,
        examples: promptData.prohibitions_examples
      },
      examplePlaceholder: {
        question: 'Você pode dar desconto?',
        answer: 'Para questões de preço e condições especiais, vou conectar você com nosso especialista comercial.'
      },
      description: 'O que o agente NÃO pode fazer'
    },
    {
      key: 'client_objections',
      title: 'Objeções de Clientes',
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      type: 'with-examples' as const,
      required: false,
      placeholder: 'Ex: Como tratar objeções sobre preço, tempo de implantação, comparação com concorrentes...',
      value: {
        description: promptData.client_objections,
        examples: promptData.client_objections_examples
      },
      examplePlaceholder: {
        question: 'Está muito caro...',
        answer: 'Entendo sua preocupação. Vamos analisar juntos o retorno que nossa solução pode trazer para seu negócio...'
      },
      description: 'Como lidar com objeções comuns'
    },
    {
      key: 'phrase_tips',
      title: 'Dicas de Frases para usar',
      icon: <Lightbulb className="h-4 w-4 text-yellow-500" />,
      type: 'with-examples' as const,
      required: false,
      placeholder: 'Ex: Frases estratégicas para diferentes momentos da conversa, cada uma com seu contexto de uso ideal.',
      value: {
        description: promptData.phrase_tips,
        examples: promptData.phrase_tips_examples
      },
      examplePlaceholder: {
        question: 'Quando usar: "Vamos encontrar a melhor solução para você"',
        answer: 'Use quando o cliente demonstrar dúvida ou resistência, para mostrar que você está focado em ajudá-lo.'
      },
      description: 'Frases úteis com contexto de uso'
    },
    {
      key: 'funnel_stages',
      title: 'Configuração do Funil',
      icon: <Target className="h-4 w-4 text-yellow-500" />,
      type: 'funnel-config' as const,
      required: false,
      placeholder: '',
      value: null, // Será calculado dinamicamente
      description: 'Configure os estágios do funil e notificações'
    }
  ];

  const handleFieldSave = async (fieldKey: string, value: any) => {
    console.log('💾 EnhancedPrompt - handleFieldSave chamado:', { fieldKey, value });
    
    try {
      // Para campos com exemplos, atualizar ambos os campos de uma vez usando batch updates
      if (typeof value === 'object' && value.description !== undefined && value.examples !== undefined) {
        console.log('📝 Campo com exemplos detectado - atualizando description e examples juntos');
        
        // Usar uma única função que atualiza ambos os campos atomicamente
        onPromptDataChange(fieldKey, value.description, `${fieldKey}_examples`, value.examples);
      } else {
        console.log('📝 Campo simples detectado - atualizando valor único');
        onPromptDataChange(fieldKey, value);
      }
      
      console.log('📝 Estado local atualizado, salvando no banco imediatamente...');
      
      // Salvar imediatamente após atualizar o estado - sem timeout
      await onSave();
      console.log('✅ EnhancedPrompt - Dados persistidos no banco com sucesso');
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
    setShowDeleteConfirm({ show: true, index });
  };

  const handleConfirmDelete = async () => {
    const { index } = showDeleteConfirm;
    if (index === null) return;
    
    console.log('🗑️ handleConfirmDelete chamado para índice:', index);
    
    try {
      const newFlow = promptData.flow.filter((_, i) => i !== index);
      onPromptDataChange('flow', newFlow);
      
      console.log('📝 Passo removido, salvando no banco imediatamente...');
      
      // Salvar imediatamente após remoção
      await onSave();
      toast.success('Passo removido com sucesso');
      console.log('✅ Passo removido e salvo no banco com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar remoção no banco:', error);
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
      return config.value ? '✅' : (config.required ? '❌' : '⚪');
    } else if (config.type === 'funnel-config') {
      // Para configuração de funil, verificar se tem funil selecionado
      return agent?.funnel_id ? '🟡' : '⚪';
    } else {
      const hasDescription = config.value.description;
      const hasExamples = config.value.examples.length > 0;
      
      // Para "dicas de frases", considerar configurado apenas se tiver exemplos
      if (config.key === 'phrase_tips') {
        return hasExamples ? '✅' : (config.required ? '❌' : '⚪');
      }
      
      // Para outros campos, manter lógica original
      return hasDescription ? (hasExamples ? '✅' : '🟡') : (config.required ? '❌' : '⚪');
    }
  };

  if (focusObjectives) {
    return (
      <div className="space-y-4">
        {/* Fluxo de Conversação */}
        <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <ListChecks className="h-5 w-5 text-yellow-500" />
              Fluxo de Conversação
            </CardTitle>
            <p className="text-xs text-gray-600 mt-1">
              Defina o passo a passo que seu agente deve seguir durante a conversa
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            
            {/* Campo para adicionar passo */}
            <div className="flex gap-2 p-3 bg-white/30 backdrop-blur-sm border border-white/20 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Plus className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <Input
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  placeholder="Ex: Passo 1: Se apresentar e perguntar o nome do lead"
                  className="flex-1 bg-white/50 border-white/30 focus:border-yellow-500 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newStepText.trim()) {
                      handleAddStep();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleAddStep}
                disabled={!newStepText.trim()}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 h-9 rounded-lg shadow-glass transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Lista de passos configurados */}
            {promptData.flow.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Fluxo Configurado ({promptData.flow.length} passo{promptData.flow.length !== 1 ? 's' : ''})
                </h4>
                {promptData.flow.map((step, index) => (
                  <div 
                    key={step.id}
                    className="flex items-center gap-3 p-3 bg-white/40 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/60 transition-all duration-200"
                  >
                    <div className="w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{step.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('✏️ Editando passo:', { step, index });
                          setEditingStep({ step, index });
                        }}
                        className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50/50 rounded-lg p-1 h-6 w-6"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStepDelete(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50/50 rounded-lg p-1 h-6 w-6"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex justify-end gap-2 pt-4 border-t border-white/30">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="px-4 h-9 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-lg text-sm"
          >
            Fechar
          </Button>
          <Button 
            onClick={async (event) => {
              try {
                await onSave();
                
                // Feedback visual de sucesso
                const button = event.currentTarget as HTMLButtonElement;
                if (button) {
                  const originalText = button.textContent;
                  button.textContent = '✅ Fluxo Salvo!';
                  button.style.backgroundColor = '#10b981';
                  setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = '';
                  }, 2000);
                }
              } catch (error) {
                console.error('❌ Erro no botão salvar fluxo:', error);
                // Erro já é tratado pelo toast no componente pai
              }
            }}
            className="px-6 h-9 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-glass hover:shadow-glass-lg transition-all duration-200 text-sm"
          >
            Salvar Fluxo
          </Button>
        </div>
      </div>
    );
  }

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
                    : config.type === 'funnel-config'
                      ? (agent?.funnel_id ? 'Pronto para configurar' : 'Funil não selecionado')
                    : config.key === 'phrase_tips'
                      ? (config.value?.examples?.length > 0 ? 'Configurado' : 'Não configurado')
                      : (config.value?.description || config.value?.examples?.length > 0 ? 'Configurado' : 'Não configurado')
                  }
                </span>
              </div>
              
              {/* Prévia do conteúdo */}
              <div className="space-y-1 mb-3">
                {config.type === 'simple' ? (
                  <div className="text-xs text-gray-700 bg-white/30 rounded p-2 min-h-[2rem] flex items-center">
                    {config.value ? String(config.value).substring(0, 80) + (String(config.value).length > 80 ? '...' : '') : 'Clique em "Configurar" para adicionar'}
                  </div>
                ) : config.type === 'funnel-config' ? (
                  <div className="text-xs text-gray-700 bg-white/30 rounded p-2 min-h-[2rem] flex items-center">
                    {agent?.funnel_id ? 'Funil selecionado - Configure os estágios' : 'Selecione um funil na Aba 1 primeiro'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-700 bg-white/30 rounded p-2">
                      {config.value?.description ? String(config.value.description).substring(0, 60) + (String(config.value.description).length > 60 ? '...' : '') : 'Sem descrição'}
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {config.value?.examples?.length || 0} exemplos configurados
                    </p>
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
        ))}
      </div>

      {/* Modais de configuração */}
      {fieldConfigs.filter(config => config.type !== 'funnel-config').map((config) => (
        <FieldConfigModal
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
        />
      ))}

      {/* Modal de configuração do funil */}
      <FunnelConfigModal
        isOpen={activeModal === 'funnel_stages'}
        onClose={() => setActiveModal(null)}
        onSave={(value) => handleFieldSave('funnel_stages', value)}
        title="Configuração do Funil"
        icon={<Target className="h-5 w-5 text-yellow-500" />}
        agent={agent}
      />

      {/* Modal de configuração de passos do fluxo */}
      <FlowStepConfigModal
        isOpen={editingStep !== null}
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

      {/* Botões de ação */}
      <div className="flex justify-end gap-2 pt-4 border-t border-white/30">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="px-4 h-9 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-lg text-sm"
        >
          Fechar
        </Button>
        <Button 
          onClick={async (event) => {
            try {
              await onSave();
              
              // Feedback visual de sucesso
              const button = event?.currentTarget as HTMLButtonElement;
              if (button) {
                const originalText = button.textContent;
                button.textContent = '✅ Salvo!';
                button.style.backgroundColor = '#10b981';
                setTimeout(() => {
                  button.textContent = originalText;
                  button.style.backgroundColor = '';
                }, 2000);
              }
            } catch (error) {
              console.error('❌ Erro no botão salvar:', error);
              // Erro já é tratado pelo toast no componente pai
            }
          }}
          className="px-6 h-9 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-glass hover:shadow-glass-lg transition-all duration-200 text-sm"
        >
          Salvar Configuração
        </Button>
      </div>

      {/* Modal de confirmação para deletar passo */}
      <Dialog open={showDeleteConfirm.show} onOpenChange={() => setShowDeleteConfirm({ show: false, index: null })}>
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
    </div>
  );
};