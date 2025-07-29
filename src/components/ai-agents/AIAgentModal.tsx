
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAgent, AIAgentPrompt } from "@/types/aiAgent";
import { AIAgentForm } from "./AIAgentForm";
import { PromptConfiguration } from "./PromptConfiguration";
import { useAIAgentPrompts } from "@/hooks/useAIAgentPrompts";
import { Bot, MessageSquare, ListChecks, Sparkles } from "lucide-react";

interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AIAgent | null;
  onSave: () => void;
}

export const AIAgentModal = ({ isOpen, onClose, agent, onSave }: AIAgentModalProps) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [workingAgent, setWorkingAgent] = useState<AIAgent | null>(null);
  const { getPromptByAgentId } = useAIAgentPrompts();
  
  // Centralized form data state with better initialization
  const [promptData, setPromptData] = useState({
    agent_function: "",
    communication_style: "",
    company_info: "",
    product_service_info: "",
    prohibitions: "",
    objectives: [] as string[]
  });

  // Auto-save functionality
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize or reset state when modal opens/closes or agent changes
  useEffect(() => {
    if (isOpen && agent) {
      setWorkingAgent(agent);
      loadPromptData(agent.id);
    } else if (isOpen && !agent) {
      // Reset state for new agent
      setWorkingAgent(null);
      resetPromptData();
    } else if (!isOpen) {
      // Reset everything when modal closes
      setActiveTab("basic");
      setWorkingAgent(null);
      resetPromptData();
      setHasUnsavedChanges(false);
    }
  }, [isOpen, agent]);

  const resetPromptData = () => {
    setPromptData({
      agent_function: "",
      communication_style: "",
      company_info: "",
      product_service_info: "",
      prohibitions: "",
      objectives: []
    });
  };

  const loadPromptData = async (agentId: string) => {
    try {
      const existingPrompt = await getPromptByAgentId(agentId);
      if (existingPrompt) {
        setPromptData({
          agent_function: existingPrompt.agent_function || "",
          communication_style: existingPrompt.communication_style || "",
          company_info: existingPrompt.company_info || "",
          product_service_info: existingPrompt.product_service_info || "",
          prohibitions: existingPrompt.prohibitions || "",
          objectives: Array.isArray(existingPrompt.objectives) ? existingPrompt.objectives : []
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
    // Auto-navigate to prompt configuration after agent creation
    setActiveTab("prompt");
    // Load existing prompt data if any
    loadPromptData(savedAgent.id);
  };

  const handlePromptDataChange = (field: keyof typeof promptData, value: any) => {
    setPromptData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    setHasUnsavedChanges(false);
    onSave();
    handleClose();
  };

  // Get current agent (either existing or newly created)
  const currentAgent = workingAgent || agent;
  const stepsCount = promptData.objectives.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
                disabled={!currentAgent}
              >
                <MessageSquare className="h-3 w-3" />
                <span className="hidden sm:inline">Configuração do Prompt</span>
                <span className="sm:hidden">Prompt</span>
              </TabsTrigger>
              <TabsTrigger 
                value="objectives" 
                className="flex items-center gap-2 text-xs font-medium data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-glass data-[state=active]:border data-[state=active]:border-white/50 rounded-lg py-2 px-3 transition-all duration-300 hover:bg-white/30"
                disabled={!currentAgent}
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
                  <PromptConfiguration 
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
                  <PromptConfiguration 
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
