
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIAgent, AIAgentPrompt } from "@/types/aiAgent";
import { AIAgentForm } from "./AIAgentForm";
import { EnhancedPromptConfiguration } from "./EnhancedPromptConfiguration";
import { useAIAgentPrompts } from "@/hooks/useAIAgentPrompts";
import { PortalErrorBoundary } from "@/components/error/PortalErrorBoundary";
import { FlowStepEnhanced, PQExample } from "@/types/aiAgent";
import { Bot, MessageSquare, ListChecks, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
  const { getPromptByAgentId, createPrompt, updatePrompt } = useAIAgentPrompts();
  
  // Centralized form data state with database structure
  const [promptData, setPromptData] = useState({
    agent_function: "",
    agent_objective: "",
    communication_style: "",
    communication_style_examples: [] as PQExample[],
    company_info: "",
    products_services: "",
    products_services_examples: [] as PQExample[],
    rules_guidelines: "",
    rules_guidelines_examples: [] as PQExample[],
    prohibitions: "",
    prohibitions_examples: [] as PQExample[],
    client_objections: "",
    client_objections_examples: [] as PQExample[],
    phrase_tips: "",
    phrase_tips_examples: [] as PQExample[],
    flow: [] as FlowStepEnhanced[]
  });

  // Auto-save functionality
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track component mount state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Initialize or reset state when modal opens/closes or agent changes
  useEffect(() => {
    if (isOpen && agent) {
      setWorkingAgent(agent);
      setAllowTabNavigation(true); // Permitir navegação para agente existente
      // Só carregar dados se não houver mudanças não salvas
      if (!hasUnsavedChanges) {
        loadPromptData(agent.id);
      }
    } else if (isOpen && !agent) {
      // Reset state for new agent
      setWorkingAgent(null);
      setAllowTabNavigation(true); // Permitir navegação livre para novo agente
      resetPromptData();
    } else if (!isOpen) {
      // Reset everything when modal closes
      setActiveTab("basic");
      setWorkingAgent(null);
      setAllowTabNavigation(false);
      resetPromptData();
      setHasUnsavedChanges(false);
    }
  }, [isOpen, agent]); // Removido hasUnsavedChanges da dependência para evitar loops

  const resetPromptData = () => {
    setPromptData({
      agent_function: "",
      agent_objective: "",
      communication_style: "",
      communication_style_examples: [],
      company_info: "",
      products_services: "",
      products_services_examples: [],
      rules_guidelines: "",
      rules_guidelines_examples: [],
      prohibitions: "",
      prohibitions_examples: [],
      client_objections: "",
      client_objections_examples: [],
      phrase_tips: "",
      phrase_tips_examples: [],
      flow: []
    });
  };

  const loadPromptData = async (agentId: string) => {
    try {
      const existingPrompt = await getPromptByAgentId(agentId);
      if (existingPrompt) {
        // Mapear dados diretamente da nova estrutura do banco
        setPromptData({
          agent_function: existingPrompt.agent_function || "",
          agent_objective: existingPrompt.agent_objective || "",
          communication_style: existingPrompt.communication_style || "",
          communication_style_examples: existingPrompt.communication_style_examples || [],
          company_info: existingPrompt.company_info || "",
          products_services: existingPrompt.products_services || "",
          products_services_examples: existingPrompt.products_services_examples || [],
          rules_guidelines: existingPrompt.rules_guidelines || "",
          rules_guidelines_examples: existingPrompt.rules_guidelines_examples || [],
          prohibitions: existingPrompt.prohibitions || "",
          prohibitions_examples: existingPrompt.prohibitions_examples || [],
          client_objections: existingPrompt.client_objections || "",
          client_objections_examples: existingPrompt.client_objections_examples || [],
          phrase_tips: existingPrompt.phrase_tips || "",
          phrase_tips_examples: existingPrompt.phrase_tips_examples || [],
          flow: existingPrompt.flow || []
        });
      } else {
        resetPromptData();
      }
    } catch (error) {
      console.error('Error loading prompt data:', error);
      resetPromptData();
    }
  };

  const handleAgentSaved = (savedAgent: AIAgent) => {
    setWorkingAgent(savedAgent);
    setAllowTabNavigation(true); // Permitir navegação após salvar agente
    // Removido: setActiveTab("prompt"); - o usuário deve navegar manualmente
    // Removido: loadPromptData(savedAgent.id); - não recarregar dados para preservar mudanças
  };

  const handlePromptDataChange = (field: keyof typeof promptData, value: any) => {
    setPromptData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleClose = () => {
    if (!isMounted) return; // Safety check
    
    // Verificar se há dados não salvos
    if (hasUnsavedChanges) {
      const confirmClose = confirm(
        'Tem certeza que deseja fechar sem salvar?\n\nTodas as alterações não salvas serão perdidas.'
      );
      if (!confirmClose) {
        return; // Usuário cancelou, não fechar
      }
    }
    
    console.log('🚪 Fechando modal - dados salvos ou usuário confirmou');
    // Add a small delay to ensure proper cleanup
    setTimeout(() => {
      onClose();
    }, 0);
  };

  const handleSave = async () => {
    console.log('🚀 INICIANDO SALVAMENTO - handleSave do modal principal');
    
    try {
      // Verificar se temos um agente (criado ou existente)
      const targetAgent = workingAgent || agent;
      console.log('🔍 Target Agent:', targetAgent);
      
      if (!targetAgent) {
        console.log('❌ Nenhum agente encontrado');
        toast.error('É necessário salvar as informações básicas primeiro');
        setActiveTab('basic');
        return;
      }

      // Preparar dados do prompt para salvamento
      const promptDataToSave = {
        agent_id: targetAgent.id,
        ...promptData
      };
      
      console.log('📝 Dados do prompt para salvar:', promptDataToSave);

      // Verificar se já existe um prompt para este agente
      console.log('🔎 Verificando se prompt existe para agente:', targetAgent.id);
      const existingPrompt = await getPromptByAgentId(targetAgent.id);
      console.log('📊 Prompt existente encontrado:', existingPrompt);
      
      if (existingPrompt) {
        // Atualizar prompt existente
        console.log('🔄 Atualizando prompt existente:', existingPrompt.id);
        const success = await updatePrompt(existingPrompt.id, promptDataToSave);
        console.log('💾 Resultado da atualização:', success);
        
        if (success) {
          toast.success('Configuração do agente salva com sucesso');
          setHasUnsavedChanges(false);
          onSave(); // Notificar parent component
          console.log('✅ SALVAMENTO CONCLUÍDO COM SUCESSO (UPDATE)');
        } else {
          toast.error('Erro ao salvar configuração');
          console.log('❌ FALHA NO SALVAMENTO (UPDATE)');
        }
      } else {
        // Criar novo prompt
        console.log('➕ Criando novo prompt');
        const newPrompt = await createPrompt(promptDataToSave);
        console.log('💾 Resultado da criação:', newPrompt);
        
        if (newPrompt) {
          toast.success('Configuração do agente salva com sucesso');
          setHasUnsavedChanges(false);
          onSave(); // Notificar parent component
          console.log('✅ SALVAMENTO CONCLUÍDO COM SUCESSO (CREATE)');
        } else {
          toast.error('Erro ao criar configuração');
          console.log('❌ FALHA NO SALVAMENTO (CREATE)');
        }
      }
    } catch (error) {
      console.error('💥 ERRO CRÍTICO no salvamento:', error);
      toast.error('Erro ao salvar configuração do agente');
    }
  };

  // Get current agent (either existing or newly created)
  const currentAgent = workingAgent || agent;
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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-xl">
        <DialogHeader className="border-b border-white/30 pb-3 bg-white/20 backdrop-blur-sm rounded-t-xl -mx-6 -mt-6 px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <div className="p-2 bg-white/30 backdrop-blur-sm rounded-lg border border-white/40 shadow-glass">
              <Bot className="h-5 w-5 text-gray-800" />
            </div>
            {agent ? "Editar Agente de IA" : "Criar Novo Agente de IA"}
          </DialogTitle>
          <p className="text-gray-700 mt-1 text-sm font-medium">
            Configure seu assistente inteligente para automatizar conversas e processos
            {hasUnsavedChanges && (
              <span className="ml-2 text-yellow-600">• Alterações não salvas</span>
            )}
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(85vh-120px)] px-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 bg-white/20 backdrop-blur-md p-1 rounded-xl h-10 border border-white/30 shadow-glass">
              <TabsTrigger 
                value="basic" 
                className="flex items-center gap-2 text-xs font-medium data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-glass data-[state=active]:border data-[state=active]:border-white/50 rounded-lg py-2 px-3 transition-all duration-300 hover:bg-white/30"
              >
                <Bot className="h-3 w-3" />
                <span className="hidden sm:inline">Informações Básicas</span>
                <span className="sm:hidden">Básico</span>
              </TabsTrigger>
              <TabsTrigger 
                value="prompt" 
                className="flex items-center gap-2 text-xs font-medium data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-glass data-[state=active]:border data-[state=active]:border-white/50 rounded-lg py-2 px-3 transition-all duration-300 hover:bg-white/30"
              >
                <MessageSquare className="h-3 w-3" />
                <span className="hidden sm:inline">Configuração do Prompt</span>
                <span className="sm:hidden">Prompt</span>
              </TabsTrigger>
              <TabsTrigger 
                value="objectives" 
                className="flex items-center gap-2 text-xs font-medium data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-glass data-[state=active]:border data-[state=active]:border-white/50 rounded-lg py-2 px-3 transition-all duration-300 hover:bg-white/30"
              >
                <ListChecks className="h-3 w-3" />
                <span className="hidden sm:inline">Fluxo do Agente</span>
                <span className="sm:hidden">Fluxo</span>
                {stepsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-black text-xs rounded-full font-bold">
                    {stepsCount}
                  </span>
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

            <TabsContent value="objectives" className="mt-0">
              <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass-lg rounded-xl transition-all duration-300 hover:bg-white/50 hover:shadow-glass">
                <CardHeader className="bg-white/20 backdrop-blur-sm border-b border-white/30 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <div className="p-1.5 bg-white/30 backdrop-blur-sm rounded-lg border border-white/40">
                      <ListChecks className="h-4 w-4 text-gray-800" />
                    </div>
                    Fluxo de Conversação
                    {stepsCount > 0 && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">
                        {stepsCount} passo{stepsCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-700 font-medium text-xs">
                    Defina o passo a passo que seu agente deve seguir durante a conversa
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 bg-white/20 backdrop-blur-sm rounded-b-xl">
                  <EnhancedPromptConfiguration 
                    agent={currentAgent} 
                    promptData={promptData}
                    onPromptDataChange={handlePromptDataChange}
                    onSave={handleSave}
                    onCancel={handleClose}
                    focusObjectives={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Info de como salvar */}
          <div className="mt-4 p-3 bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              💡 <strong>Dica:</strong> Use os botões "Configurar" em cada campo para editar e salvar suas configurações
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </PortalErrorBoundary>
  );
};
