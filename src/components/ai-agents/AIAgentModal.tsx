
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAgent } from "@/types/aiAgent";
import { AIAgentForm } from "./AIAgentForm";
import { PromptConfiguration } from "./PromptConfiguration";
import { Bot, MessageSquare, Target, Sparkles } from "lucide-react";

interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AIAgent | null;
  onSave: () => void;
}

export const AIAgentModal = ({ isOpen, onClose, agent, onSave }: AIAgentModalProps) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [currentAgent, setCurrentAgent] = useState<AIAgent | null>(agent || null);

  const handleAgentSaved = (savedAgent: AIAgent) => {
    setCurrentAgent(savedAgent);
    setActiveTab("prompt");
  };

  const handleClose = () => {
    setActiveTab("basic");
    setCurrentAgent(null);
    onClose();
  };

  const handleSave = () => {
    onSave();
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl">
        <DialogHeader className="border-b border-white/10 pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl text-blue-600 border border-white/20">
              <Bot className="h-6 w-6" />
            </div>
            {agent ? "Editar Agente de IA" : "Criar Novo Agente de IA"}
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            Configure seu assistente inteligente para automatizar conversas e processos
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/20 backdrop-blur-sm p-1 rounded-xl h-14 border border-white/20">
              <TabsTrigger 
                value="basic" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white/60 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-sm rounded-lg py-3 transition-all duration-200"
              >
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Informações Básicas</span>
                <span className="sm:hidden">Básico</span>
              </TabsTrigger>
              <TabsTrigger 
                value="prompt" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white/60 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-sm rounded-lg py-3 transition-all duration-200"
                disabled={!currentAgent && !agent}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Configuração do Prompt</span>
                <span className="sm:hidden">Prompt</span>
              </TabsTrigger>
              <TabsTrigger 
                value="objectives" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white/60 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-sm rounded-lg py-3 transition-all duration-200"
                disabled={!currentAgent && !agent}
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Objetivos</span>
                <span className="sm:hidden">Metas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-0">
              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 backdrop-blur-sm border-b border-white/10 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Informações Básicas do Agente
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Configure as informações fundamentais do seu agente de IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <AIAgentForm 
                    agent={agent} 
                    onSave={handleAgentSaved}
                    onCancel={handleClose}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompt" className="mt-0">
              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl">
                <CardHeader className="bg-gradient-to-r from-green-50/50 to-blue-50/50 backdrop-blur-sm border-b border-white/10 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    Configuração do Prompt
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Defina como seu agente deve se comunicar e comportar
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <PromptConfiguration 
                    agent={currentAgent || agent} 
                    onSave={handleSave}
                    onCancel={handleClose}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="objectives" className="mt-0">
              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl">
                <CardHeader className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 backdrop-blur-sm border-b border-white/10 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <Target className="h-5 w-5 text-purple-600" />
                    Objetivos do Agente
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Configure os passos que o agente deve seguir para atingir seus objetivos
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <PromptConfiguration 
                    agent={currentAgent || agent} 
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
