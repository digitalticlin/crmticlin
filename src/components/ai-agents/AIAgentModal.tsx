
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl">
        <DialogHeader className="border-b border-white/30 pb-6 bg-white/20 backdrop-blur-sm rounded-t-2xl -mx-6 -mt-6 px-6 pt-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            <div className="p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/40 shadow-glass">
              <Bot className="h-6 w-6 text-gray-800" />
            </div>
            {agent ? "Editar Agente de IA" : "Criar Novo Agente de IA"}
          </DialogTitle>
          <p className="text-gray-700 mt-2 text-base font-medium">
            Configure seu assistente inteligente para automatizar conversas e processos
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/20 backdrop-blur-md p-1.5 rounded-2xl h-16 border border-white/30 shadow-glass">
              <TabsTrigger 
                value="basic" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-glass data-[state=active]:border data-[state=active]:border-white/50 rounded-xl py-3 px-4 transition-all duration-300 hover:bg-white/30"
              >
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Informações Básicas</span>
                <span className="sm:hidden">Básico</span>
              </TabsTrigger>
              <TabsTrigger 
                value="prompt" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-glass data-[state=active]:border data-[state=active]:border-white/50 rounded-xl py-3 px-4 transition-all duration-300 hover:bg-white/30"
                disabled={!currentAgent && !agent}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Configuração do Prompt</span>
                <span className="sm:hidden">Prompt</span>
              </TabsTrigger>
              <TabsTrigger 
                value="objectives" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-glass data-[state=active]:border data-[state=active]:border-white/50 rounded-xl py-3 px-4 transition-all duration-300 hover:bg-white/30"
                disabled={!currentAgent && !agent}
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Objetivos</span>
                <span className="sm:hidden">Metas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-0">
              <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass-lg rounded-2xl transition-all duration-300 hover:bg-white/50 hover:shadow-glass">
                <CardHeader className="bg-white/20 backdrop-blur-sm border-b border-white/30 rounded-t-2xl">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                    <div className="p-2 bg-white/30 backdrop-blur-sm rounded-xl border border-white/40">
                      <Sparkles className="h-5 w-5 text-gray-800" />
                    </div>
                    Informações Básicas do Agente
                  </CardTitle>
                  <CardDescription className="text-gray-700 font-medium">
                    Configure as informações fundamentais do seu agente de IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-white/20 backdrop-blur-sm rounded-b-2xl">
                  <AIAgentForm 
                    agent={agent} 
                    onSave={handleAgentSaved}
                    onCancel={handleClose}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompt" className="mt-0">
              <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass-lg rounded-2xl transition-all duration-300 hover:bg-white/50 hover:shadow-glass">
                <CardHeader className="bg-white/20 backdrop-blur-sm border-b border-white/30 rounded-t-2xl">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                    <div className="p-2 bg-white/30 backdrop-blur-sm rounded-xl border border-white/40">
                      <MessageSquare className="h-5 w-5 text-gray-800" />
                    </div>
                    Configuração do Prompt
                  </CardTitle>
                  <CardDescription className="text-gray-700 font-medium">
                    Defina como seu agente deve se comunicar e comportar
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-white/20 backdrop-blur-sm rounded-b-2xl">
                  <PromptConfiguration 
                    agent={currentAgent || agent} 
                    onSave={handleSave}
                    onCancel={handleClose}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="objectives" className="mt-0">
              <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass-lg rounded-2xl transition-all duration-300 hover:bg-white/50 hover:shadow-glass">
                <CardHeader className="bg-white/20 backdrop-blur-sm border-b border-white/30 rounded-t-2xl">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                    <div className="p-2 bg-white/30 backdrop-blur-sm rounded-xl border border-white/40">
                      <Target className="h-5 w-5 text-gray-800" />
                    </div>
                    Objetivos do Agente
                  </CardTitle>
                  <CardDescription className="text-gray-700 font-medium">
                    Configure os passos que o agente deve seguir para atingir seus objetivos
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-white/20 backdrop-blur-sm rounded-b-2xl">
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
