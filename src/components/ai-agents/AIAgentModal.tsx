
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIAgent, AIAgentPrompt } from "@/types/aiAgent";
import { AIAgentForm } from "./AIAgentForm";
import { EnhancedPromptConfiguration } from "./EnhancedPromptConfiguration";
import { FunnelStagesConfiguration } from "./FunnelStagesConfiguration";
import { useAIAgentPrompts } from "@/hooks/useAIAgentPrompts";
import { PortalErrorBoundary } from "@/components/error/PortalErrorBoundary";
import { FlowStepEnhanced, PQExample } from "@/types/aiAgent";
import { Bot, MessageSquare, ListChecks, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { unstable_batchedUpdates } from "react-dom";
import { supabase } from "@/integrations/supabase/client";

interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AIAgent | null;
  onSave: () => void;
}

export const AIAgentModal = ({ isOpen, onClose, agent, onSave }: AIAgentModalProps) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [workingAgent, setWorkingAgent] = useState<AIAgent | null>(null);
  const [isMounted, setIsMounted] = useState(true);
  const [allowTabNavigation, setAllowTabNavigation] = useState(false); // Permitir navegação livre
  const { 
    getAIAgentPrompt: getPromptByAgentId, 
    createPromptFromAgent: createPrompt, 
    updateAIAgentPrompt: updatePrompt 
  } = useAIAgentPrompts();
  
  // Centralized form data state with NEW database structure
  const [promptData, setPromptData] = useState({
    agent_function: "",
    agent_objective: "",
    communication_style: "",
    communication_style_examples: [] as PQExample[],
    company_info: "",
    products_services: "",
    rules_guidelines: [] as any[], // JSONB - array de objetos
    prohibitions: [] as any[], // JSONB - array de objetos
    client_objections: [] as any[], // JSONB - array de objetos com objeção+resposta
    flow: [] as FlowStepEnhanced[]
  });

  // Auto-save functionality
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasBasicFormChanges, setHasBasicFormChanges] = useState(false);
  const [showConfirmCloseModal, setShowConfirmCloseModal] = useState(false);

  // Track component mount state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Função unificada para obter o agente atual - garante consistência
  const getCurrentAgent = (): AIAgent | null => {
    const currentAgent = workingAgent || agent;
    console.log('🎯 getCurrentAgent() chamado:', currentAgent ? {
      id: currentAgent.id,
      name: currentAgent.name,
      source: workingAgent ? 'workingAgent' : 'agent prop'
    } : null);
    return currentAgent;
  };

  // Initialize or reset state when modal opens/closes or agent changes
  useEffect(() => {
    console.log('🔍 MODAL useEffect triggered:', { isOpen, agentId: agent?.id, agentName: agent?.name });

    if (isOpen && agent) {
      console.log('🟢 MODAL - Abrindo modal para agente existente:', agent.id);
      setWorkingAgent(agent);
      setAllowTabNavigation(true); // Permitir navegação para agente existente

      // CORREÇÃO CRÍTICA: SEMPRE carregar dados atualizados do banco
      // para garantir que os dados salvos sejam exibidos
      console.log('🔄 MODAL - Iniciando carregamento de dados atualizados do banco');
      loadPromptData(agent.id);

      // Reset estados de mudanças ao carregar
      setHasUnsavedChanges(false);
      setHasBasicFormChanges(false);
    } else if (isOpen && !agent) {
      console.log('🟡 MODAL - Abrindo modal para novo agente');
      // Reset state for new agent
      setWorkingAgent(null);
      setAllowTabNavigation(true); // Permitir navegação livre para novo agente
      resetPromptData();
      setHasUnsavedChanges(false);
      setHasBasicFormChanges(false);
    } else if (!isOpen) {
      console.log('🔴 MODAL - Fechando modal');
      // Reset everything when modal closes
      setActiveTab("basic");
      setWorkingAgent(null);
      setAllowTabNavigation(false);
      setHasUnsavedChanges(false);
      setHasBasicFormChanges(false);
    }
  }, [isOpen, agent]); // Removido hasUnsavedChanges da dependência para evitar loops

  const resetPromptData = () => {
    unstable_batchedUpdates(() => {
      setPromptData({
        agent_function: "",
        agent_objective: "",
        communication_style: "",
        communication_style_examples: [],
        company_info: "",
        products_services: "",
        rules_guidelines: [], // JSONB array
        prohibitions: [], // JSONB array
        client_objections: [], // JSONB array
        flow: []
      });
      // Reset também não deve marcar como alteração não salva
      setHasUnsavedChanges(false);
    });
  };

  const loadPromptData = async (agentId: string) => {
    console.log('\n=== CARREGAMENTO DE DADOS DO PROMPT ===');
    console.log('📎 Carregando dados para agente ID:', agentId);
    console.log('🕐 Timestamp do carregamento:', new Date().toLocaleTimeString());

    try {
      const existingPrompt = await getPromptByAgentId(agentId);
      console.log('📊 Prompt encontrado:', existingPrompt ? 'SIM' : 'NÃO');
      
      if (existingPrompt) {
        console.log('📝 Mapeando dados do prompt encontrado...');
        console.log('📊 Dados carregados do banco:', {
          agent_function: existingPrompt.agent_function ? 'PREENCHIDO' : 'VAZIO',
          agent_objective: existingPrompt.agent_objective ? 'PREENCHIDO' : 'VAZIO',
          communication_style: existingPrompt.communication_style ? 'PREENCHIDO' : 'VAZIO',
          communication_style_examples: existingPrompt.communication_style_examples?.length || 0,
          company_info: existingPrompt.company_info ? 'PREENCHIDO' : 'VAZIO',
          products_services: existingPrompt.products_services ? 'PREENCHIDO' : 'VAZIO',
          flow: existingPrompt.flow?.length || 0
        });
        
        // Mapear dados da nova estrutura consolidada do banco
        const newPromptData = {
          agent_function: existingPrompt.agent_function || "",
          agent_objective: existingPrompt.agent_objective || "",
          communication_style: existingPrompt.communication_style || "",
          communication_style_examples: existingPrompt.communication_style_examples || [],
          company_info: existingPrompt.company_info || "",
          products_services: existingPrompt.products_services || "",
          rules_guidelines: Array.isArray(existingPrompt.rules_guidelines) ? existingPrompt.rules_guidelines : [],
          prohibitions: Array.isArray(existingPrompt.prohibitions) ? existingPrompt.prohibitions : [],
          client_objections: Array.isArray(existingPrompt.client_objections) ? existingPrompt.client_objections : [],
          flow: Array.isArray(existingPrompt.flow) ? existingPrompt.flow : []
        };

        console.log('📝 MODAL - Dados formatados para setPromptData (CARREGAMENTO):', {
          agent_function: newPromptData.agent_function ? `CARREGADO (${newPromptData.agent_function.length} chars)` : 'VAZIO',
          agent_objective: newPromptData.agent_objective ? `CARREGADO (${newPromptData.agent_objective.length} chars)` : 'VAZIO',
          communication_style: newPromptData.communication_style ? `CARREGADO (${newPromptData.communication_style.length} chars)` : 'VAZIO',
          company_info: newPromptData.company_info ? `CARREGADO (${newPromptData.company_info.length} chars)` : 'VAZIO'
        });
        
        unstable_batchedUpdates(() => {
          setPromptData(newPromptData);
          // NÃO marcar como hasUnsavedChanges pois é carregamento inicial
          setHasUnsavedChanges(false);
        });

        // VERIFICAÇÃO CRÍTICA: Usar callback para verificar estado após atualização
        setTimeout(() => {
          // Usar uma função para capturar o estado mais recente
          setPromptData(currentData => {
            console.log('🔍 MODAL - Verificação pós-setPromptData (callback):', {
              agent_function_atual: currentData.agent_function ? `APLICADO (${currentData.agent_function.length} chars)` : 'VAZIO',
              agent_objective_atual: currentData.agent_objective ? `APLICADO (${currentData.agent_objective.length} chars)` : 'VAZIO',
              communication_style_atual: currentData.communication_style ? `APLICADO (${currentData.communication_style.length} chars)` : 'VAZIO'
            });
            return currentData; // Não modificar, apenas verificar
          });
        }, 100);

        // Estado foi atualizado com sucesso
        console.log('✅ Dados do prompt carregados e mapeados com sucesso - sem marcar como alteração');
      } else {
        console.log('⚠️ Nenhum prompt encontrado - usando dados vazios');
        resetPromptData();
      }
      console.log('=== FIM CARREGAMENTO PROMPT ===\n');
    } catch (error) {
      console.error('❌ ERRO AO CARREGAR DADOS DO PROMPT:', error);
      resetPromptData();
      console.log('=== FIM CARREGAMENTO (COM ERRO) ===\n');
    }
  };

  const handleAgentSaved = (savedAgent: AIAgent) => {
    console.log('🎯 AIAgentModal.handleAgentSaved chamado:', savedAgent.name);
    unstable_batchedUpdates(() => {
      setWorkingAgent(savedAgent);
      setAllowTabNavigation(true);
      // BUG 1 FIX: Resetar estado de mudanças não salvas após salvamento bem-sucedido
      setHasUnsavedChanges(false);
      setHasBasicFormChanges(false);
    });
    
    // CRÍTICO: Chamar onSave para notificar a página principal
    console.log('📢 Notificando página principal via onSave...');
    onSave();
  };

  const handleBasicFormChange = (hasChanges: boolean) => {
    console.log(`📊 AIAgentModal - Mudanças na Aba 1: ${hasChanges}`);
    setHasBasicFormChanges(hasChanges);
  };

  const handlePromptDataChange = (
    field: keyof typeof promptData,
    value: any,
    exampleField?: string,
    exampleValue?: any,
    isInternalLoad: boolean = false
  ) => {
    // Usar batch updates para estabilidade, suportando atualização atômica de campos com exemplos
    unstable_batchedUpdates(() => {
      if (exampleField && exampleValue !== undefined) {
        // Atualizar ambos os campos atomicamente para evitar race conditions
        console.log('🔄 MODAL - Atualizando campo duplo:', { field, value, exampleField, exampleValue, isInternalLoad });
        setPromptData(prev => ({
          ...prev,
          [field]: value,
          [exampleField]: exampleValue
        }));
      } else {
        // Atualização de campo único
        console.log('🔄 MODAL - Atualizando campo único:', { field, value, isInternalLoad });
        console.log('📊 MODAL - Estado ANTES do update:', {
          campo: field,
          valorAnterior: promptData[field] ? (typeof promptData[field] === 'string' ? `PREENCHIDO (${promptData[field].length} chars)` : `PREENCHIDO (${JSON.stringify(promptData[field]).length} chars)`) : 'VAZIO',
          novoValor: value ? (typeof value === 'string' ? `PREENCHIDO (${value.length} chars)` : `PREENCHIDO (${JSON.stringify(value).length} chars)`) : 'VAZIO'
        });

        setPromptData(prev => {
          const newState = { ...prev, [field]: value };
          console.log('📝 MODAL - Novo estado calculado:', {
            campo: field,
            novoValor: newState[field] ? (typeof newState[field] === 'string' ? `PREENCHIDO (${newState[field].length} chars)` : `PREENCHIDO (${JSON.stringify(newState[field]).length} chars)`) : 'VAZIO'
          });
          return newState;
        });

        // Estado será verificado via useEffect quando promptData mudar
      }

      // Só marcar como não salvo se for uma mudança real do usuário, não carregamento interno
      if (!isInternalLoad) {
        console.log('💾 MODAL - Marcando como alteração não salva (mudança do usuário)');
        setHasUnsavedChanges(true);
      } else {
        console.log('📂 MODAL - Carregamento interno - não marcar como alteração não salva');
      }
    });
  };

  // Criar uma função de salvamento que usa o estado mais atualizado
  const saveWithFreshState = useCallback((freshPromptData: typeof promptData) => {
    return handleSave({ fromTab: 'prompt', skipRedirect: true }, freshPromptData);
  }, []);

  // DEBUG: Monitorar mudanças no promptData
  useEffect(() => {
    console.log('🔄 PROMPT DATA MUDOU:', {
      agent_function: promptData.agent_function ? `${promptData.agent_function.length} chars` : 'VAZIO',
      timestamp: new Date().toLocaleTimeString()
    });
  }, [promptData.agent_function]);

  const handleClose = () => {
    if (!isMounted) return; // Safety check
    
    console.log('🚪 handleClose chamado - verificando estado antes de fechar');
    console.log('📊 Estado atual:', {
      hasUnsavedChanges,
      currentAgent: getCurrentAgent()?.id || null,
      promptDataEmpty: !promptData.agent_function && !promptData.agent_objective,
      flowSteps: promptData.flow.length
    });

    // BUG ABA 1 FIX: Verificar mudanças tanto da Aba 1 quanto da Aba 2
    if (hasUnsavedChanges || hasBasicFormChanges) {
      console.log('⚠️ Alterações não salvas detectadas - solicitando confirmação');
      console.log('  - Aba 2 (prompts):', hasUnsavedChanges);
      console.log('  - Aba 1 (dados básicos):', hasBasicFormChanges);
      setShowConfirmCloseModal(true);
      return; // Mostrar modal de confirmação
    }
    
    console.log('✅ Nenhuma alteração não salva detectada - fechando diretamente');
    // Fechar diretamente se não há mudanças não salvas
    handleForceClose();
  };

  const handleForceClose = () => {
    console.log('🚪 Fechando modal - dados salvos ou usuário confirmou');
    setShowConfirmCloseModal(false);
    
    // Add a small delay to ensure proper cleanup
    setTimeout(() => {
      onClose();
    }, 0);
  };

  const handleCancelClose = () => {
    setShowConfirmCloseModal(false);
  };

  const handleSave = async (saveContext?: { fromTab?: string; skipRedirect?: boolean }, freshPromptData?: typeof promptData) => {
    return new Promise<void>((resolve, reject) => {
      // Capturar o estado mais recente usando setState callback
      setPromptData(currentPromptData => {
        // Usar dados frescos se fornecidos, caso contrário usar o estado mais recente
        const dataToSave = freshPromptData || currentPromptData;

        console.log('🔍 MODAL - Dados que serão salvos (estado mais recente):', {
          agent_function: dataToSave.agent_function ? `FRESCOS (${dataToSave.agent_function.length} chars)` : 'VAZIO',
          agent_objective: dataToSave.agent_objective ? `FRESCOS (${dataToSave.agent_objective.length} chars)` : 'VAZIO',
          communication_style: dataToSave.communication_style ? `FRESCOS (${dataToSave.communication_style.length} chars)` : 'VAZIO'
        });

        // Executar salvamento assíncrono
        performSave(dataToSave, saveContext).then(resolve).catch(reject);

        return currentPromptData; // Não modificar o estado
      });
    });
  };

  const performSave = async (dataToSave: typeof promptData, saveContext?: { fromTab?: string; skipRedirect?: boolean }) => {
    console.log('\n=== SALVAMENTO INICIADO (performSave) ===');
    console.log('🚀 performSave do modal principal - DIAGNÓSTICO COMPLETO');
    console.log('🔧 Contexto do salvamento:', saveContext);
    console.log('\n📊 ESTADO ATUAL:');
    console.log('  - agent (prop recebida):', agent ? { id: agent.id, name: agent.name } : null);
    console.log('  - workingAgent (estado local):', workingAgent ? { id: workingAgent.id, name: workingAgent.name } : null);
    console.log('  - currentAgent (computed):', getCurrentAgent() ? { id: getCurrentAgent()?.id, name: getCurrentAgent()?.name } : null);
    console.log('\n📝 PROMPT DATA:');
    console.log('  - agent_function:', dataToSave.agent_function ? 'PREENCHIDO' : 'VAZIO');
    console.log('  - agent_objective:', dataToSave.agent_objective ? 'PREENCHIDO' : 'VAZIO');
    console.log('  - communication_style:', dataToSave.communication_style ? 'PREENCHIDO' : 'VAZIO');
    console.log('  - flow steps:', dataToSave.flow.length);
    console.log('\n🔍 MODO DE OPERAÇÃO:', agent ? 'EDIÇÃO' : 'CRIAÇÃO');
    
    try {
      // Verificar se temos um agente (criado ou existente)
      const targetAgent = getCurrentAgent();
      console.log('\n🎯 TARGET AGENT SELECIONADO:', targetAgent ? {
        id: targetAgent.id,
        name: targetAgent.name,
        type: targetAgent.type,
        fonte: workingAgent ? 'workingAgent' : 'agent prop'
      } : 'NENHUM AGENTE ENCONTRADO');
      
      if (!targetAgent) {
        console.log('❌ Nenhum agente encontrado');
        
        // Se for salvamento da ABA 2/3, auto-criar agente
        if (saveContext?.fromTab === 'objectives' || saveContext?.fromTab === 'prompt' || saveContext?.skipRedirect) {
          console.log('🚀 AUTO-CRIANDO agente para salvamento da Aba 2/3');
          
          try {
            // Criar agente com dados mínimos
            const newAgentData = {
              name: "NOVO AGENTE",
              type: "sales" as const,
              funnel_id: null,
              whatsapp_number_id: null
            };
            
            console.log('📝 Criando agente com dados:', newAgentData);
            
            // Criar agente usando supabase diretamente
            const { data: user } = await supabase.auth.getUser();
            
            if (!user.user) {
              throw new Error('Usuário não autenticado');
            }
            
            const { data: newAgent, error: createError } = await supabase
              .from('ai_agents')
              .insert({
                ...newAgentData,
                created_by_user_id: user.user.id
              })
              .select()
              .single();
              
            if (createError) throw createError;
            
            if (newAgent) {
              console.log('✅ Agente auto-criado com sucesso:', newAgent.id);
              
              // Atualizar estados do modal
              const typedAgent = {
                ...newAgent,
                type: newAgent.type as 'attendance' | 'sales' | 'support' | 'custom',
                status: newAgent.status as 'active' | 'inactive'
              };
              
              setWorkingAgent(typedAgent);
              setAllowTabNavigation(true);
              
              toast.success('🤖 Agente criado automaticamente', {
                description: 'Você pode renomear na Aba 1 depois',
                duration: 3000
              });
              
              // Notificar componente pai sobre a criação do agente
              onSave();
              
              // Continuar com o salvamento usando o agente recém-criado
              // Atualizar targetAgent para o novo agente
              console.log('🔄 Continuando salvamento com agente auto-criado');
            } else {
              throw new Error('Falha ao criar agente');
            }
          } catch (error) {
            console.error('❌ Erro ao auto-criar agente:', error);
            toast.error('Erro ao criar agente automaticamente', {
              description: 'Crie o agente na Aba 1 primeiro',
              duration: 4000
            });
            setActiveTab('basic');
            return;
          }
        } else {
          console.log('  - Redirecionando usuário para criar o agente primeiro');
          
          toast.info('📝 Crie o agente primeiro', {
            description: 'Complete as informações básicas antes de configurar prompts e fluxos',
            duration: 4000
          });
          
          setActiveTab('basic');
          return;
        }
      }
      
      // Re-obter targetAgent após possível criação automática
      const finalTargetAgent = getCurrentAgent();
      console.log('✅ Target Agent final:', {
        id: finalTargetAgent?.id,
        name: finalTargetAgent?.name,
        type: finalTargetAgent?.type
      });
      
      if (!finalTargetAgent) {
        console.error('❌ Falha crítica: nenhum agente disponível após tentativa de criação');
        return;
      }

      // Preparar dados do prompt para salvamento
      console.log('🔍 ESTADO DO PROMPT DATA NO MOMENTO DO SALVAMENTO:');
      console.log('  - agent_function atual:', dataToSave.agent_function ? `PREENCHIDO (${dataToSave.agent_function.length} chars)` : 'VAZIO');
      console.log('  - agent_objective atual:', dataToSave.agent_objective ? `PREENCHIDO (${dataToSave.agent_objective.length} chars)` : 'VAZIO');
      console.log('  - communication_style atual:', dataToSave.communication_style ? `PREENCHIDO (${dataToSave.communication_style.length} chars)` : 'VAZIO');
      console.log('  - usando dados frescos:', 'SIM (sempre usa estado mais recente)');
      
      const promptDataToSave = {
        agent_id: finalTargetAgent.id,
        ...dataToSave,
        // Adicionar campos obrigatórios com valores padrão para evitar erro TypeScript
        products_services_examples: [],
        rules_guidelines_examples: [],
        prohibitions_examples: [],
        client_objections_examples: [],
        phrase_tips: '',
        phrase_tips_examples: [],
        funnel_configuration: []
      };
      
      console.log('📝 DADOS DO PROMPT PARA SALVAR - DETALHADO:');
      console.log('  - agent_id:', promptDataToSave.agent_id);
      console.log('  - agent_function:', promptDataToSave.agent_function ? `PREENCHIDO (${promptDataToSave.agent_function.length} chars)` : 'VAZIO');
      console.log('  - agent_objective:', promptDataToSave.agent_objective ? `PREENCHIDO (${promptDataToSave.agent_objective.length} chars)` : 'VAZIO');
      console.log('  - communication_style:', promptDataToSave.communication_style ? `PREENCHIDO (${promptDataToSave.communication_style.length} chars)` : 'VAZIO');
      console.log('  - communication_style_examples:', promptDataToSave.communication_style_examples?.length || 0, 'exemplos');
      console.log('  - company_info:', promptDataToSave.company_info ? `PREENCHIDO (${promptDataToSave.company_info.length} chars)` : 'VAZIO');
      console.log('  - products_services:', promptDataToSave.products_services ? `PREENCHIDO (${promptDataToSave.products_services.length} chars)` : 'VAZIO');
      console.log('  - flow:', promptDataToSave.flow?.length || 0, 'passos');

      // Verificar se já existe um prompt para este agente
      console.log('\n🔎 VERIFICANDO PROMPT EXISTENTE');
      console.log('  - Agente ID:', finalTargetAgent.id);
      console.log('  - Agente pertence ao usuário:', finalTargetAgent.created_by_user_id);
      
      const existingPrompt = await getPromptByAgentId(finalTargetAgent.id);
      console.log('\n📊 RESULTADO DA BUSCA:');
      if (existingPrompt) {
        console.log('  - Prompt encontrado ID:', existingPrompt.id);
        console.log('  - Prompt criado por:', existingPrompt.created_by_user_id);
        console.log('  - Prompt criado em:', existingPrompt.created_at);
        console.log('  - Modo de operação: ATUALIZAR');
      } else {
        console.log('  - Nenhum prompt encontrado');
        console.log('  - Modo de operação: CRIAR NOVO');
      }
      
      if (existingPrompt) {
        // Atualizar prompt existente
        console.log('🔄 Atualizando prompt existente:', existingPrompt.id);
        const updatedAgent = await updatePrompt({ agent_id: existingPrompt.agent_id, ...promptDataToSave });
        console.log('💾 Resultado da atualização:', updatedAgent);

        if (updatedAgent) {
          toast.success('Configuração do agente salva com sucesso');
          setHasUnsavedChanges(false);

          // Só chamar onSave se não há contexto específico de salvamento ou se especificamente solicitado
          if (!saveContext || !saveContext.skipRedirect) {
            onSave(); // Notificar parent component
          }
          console.log('✅ SALVAMENTO CONCLUÍDO COM SUCESSO (UPDATE)');
        } else {
          throw new Error('Falha na atualização do prompt');
        }
      } else {
        // Criar novo prompt
        console.log('➕ Criando novo prompt');
        const newPrompt = await createPrompt(finalTargetAgent);
        console.log('💾 Resultado da criação:', newPrompt);
        
        if (newPrompt) {
          toast.success('Configuração do agente salva com sucesso');
          setHasUnsavedChanges(false);

          // Só chamar onSave se não há contexto específico de salvamento ou se especificamente solicitado
          if (!saveContext || !saveContext.skipRedirect) {
            onSave(); // Notificar parent component
          }
          console.log('✅ SALVAMENTO CONCLUÍDO COM SUCESSO (CREATE)');
        } else {
          throw new Error('Falha na criação do prompt');
        }
      }
    } catch (error) {
      console.error('💥 ERRO CRÍTICO no salvamento:', error);
      toast.error('Erro ao salvar configuração do agente');
      throw error; // Re-throw para que componentes filhos saibam que houve erro
    }
  };

  // Get current agent (either existing or newly created)
  const currentAgent = getCurrentAgent();
  const stepsCount = promptData.flow.length;
  
  // Permitir acesso às abas mesmo sem agent (para novos agentes)
  const canAccessTabs = allowTabNavigation;

  return (
    <PortalErrorBoundary>
      <Dialog open={isOpen} onOpenChange={(open) => {
        // Permitir fechamento apenas com ESC ou programaticamente
        if (!open) {
          handleClose();
        }
      }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden glass-modal rounded-xl">
        <DialogHeader className="border-b border-white/30 pb-3 glass-header rounded-t-xl -mx-6 -mt-6 px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <div className="p-2 glass-light rounded-lg border border-white/40">
              <Bot className="h-5 w-5 text-gray-800" />
            </div>
            {agent ? "Editar Agente de IA" : "Criar Novo Agente de IA"}
          </DialogTitle>
          <p className="text-gray-700 mt-1 text-sm font-medium">
            Configure seu assistente inteligente para automatizar conversas e processos
            {(hasUnsavedChanges || hasBasicFormChanges) && (
              <span className="ml-2 text-yellow-600">• Alterações não salvas</span>
            )}
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(85vh-120px)] px-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/20 backdrop-blur-md p-1 rounded-xl h-10 border border-white/30 shadow-glass">
              <TabsTrigger 
                value="basic" 
                className="flex items-center gap-2 text-xs font-medium data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-glass data-[state=active]:border data-[state=active]:border-white/50 rounded-lg py-2 px-3 transition-all duration-300 hover:bg-white/30"
              >
                <Bot className="h-3 w-3" />
                <span className="hidden sm:inline">Informações Básicas</span>
                <span className="sm:hidden">Básico</span>
                {!agent && !workingAgent && (
                  <span className="ml-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Comece aqui"></span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="prompt" 
                className="flex items-center gap-2 text-xs font-medium data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-glass data-[state=active]:border data-[state=active]:border-white/50 rounded-lg py-2 px-3 transition-all duration-300 hover:bg-white/30"
              >
                <MessageSquare className="h-3 w-3" />
                <span className="hidden sm:inline">Configuração do Prompt</span>
                <span className="sm:hidden">Prompt</span>
                {currentAgent && !agent && (
                  <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Próximo passo"></span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-0">
              <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass-lg rounded-xl transition-all duration-300 hover:bg-white/50 hover:shadow-glass">
                <CardHeader className="bg-white/20 backdrop-blur-sm border-b border-white/30 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <div className="p-1.5 bg-white/30 backdrop-blur-sm rounded-lg border border-white/40">
                      <Sparkles className="h-4 w-4 text-gray-800" />
                    </div>
                    Informações Básicas do Agente
                  </CardTitle>
                  <CardDescription className="text-gray-700 font-medium text-xs">
                    Configure as informações fundamentais do seu agente de IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 bg-white/20 backdrop-blur-sm rounded-b-xl">
                  <AIAgentForm 
                    agent={agent} 
                    onSave={handleAgentSaved}
                    onCancel={handleClose}
                    onFormChange={handleBasicFormChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompt" className="mt-0">
              <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass-lg rounded-xl transition-all duration-300 hover:bg-white/50 hover:shadow-glass">
                <CardHeader className="bg-white/20 backdrop-blur-sm border-b border-white/30 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <div className="p-1.5 bg-white/30 backdrop-blur-sm rounded-lg border border-white/40">
                      <MessageSquare className="h-4 w-4 text-gray-800" />
                    </div>
                    Configuração do Prompt
                  </CardTitle>
                  <CardDescription className="text-gray-700 font-medium text-xs">
                    Defina como seu agente deve se comunicar e comportar
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 bg-white/20 backdrop-blur-sm rounded-b-xl">
                  <EnhancedPromptConfiguration 
                    agent={currentAgent} 
                    promptData={promptData}
                    onPromptDataChange={handlePromptDataChange}
                    onSave={handleSave}
                    onCancel={handleClose}
                  />
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
          
          {/* Info de como salvar */}
          <div className="mt-4 p-3 bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 rounded-lg">
            {!currentAgent ? (
              <p className="text-sm text-blue-800 text-center">
                🚀 <strong>Novo agente:</strong> Comece criando as informações básicas na primeira aba, depois configure prompts e fluxos
              </p>
            ) : (
              <p className="text-sm text-blue-800 text-center">
                💡 <strong>Dica:</strong> Use os botões "Configurar" em cada campo para editar e salvar suas configurações
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Modal de confirmação para fechar sem salvar */}
    <Dialog open={showConfirmCloseModal} onOpenChange={() => setShowConfirmCloseModal(false)}>
      <DialogContent className="max-w-md bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-xl">
        <DialogHeader className="border-b border-white/30 pb-3 bg-white/20 backdrop-blur-sm rounded-t-xl -mx-6 -mt-6 px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <div className="p-2 bg-yellow-500/20 backdrop-blur-sm rounded-lg border border-yellow-500/30">
              <X className="h-5 w-5 text-yellow-600" />
            </div>
            Alterações não salvas
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            Tem certeza que deseja sair sem salvar? Todas as alterações feitas serão perdidas.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/30 bg-white/10 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancelClose}
            className="px-4 h-10 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-lg transition-all duration-200"
          >
            Continuar editando
          </Button>
          <Button 
            onClick={handleForceClose}
            className="px-4 h-10 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200"
          >
            Sair sem salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </PortalErrorBoundary>
  );
};
