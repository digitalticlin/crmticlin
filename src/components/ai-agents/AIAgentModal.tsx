
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-900/85 backdrop-blur-xl border-0 shadow-2xl rounded-3xl ring-1 ring-white/20 dark:ring-white/10">
        <DialogHeader className="border-b border-white/20 dark:border-white/10 pb-6 bg-gradient-to-r from-white/40 to-white/20 dark:from-white/10 dark:to-white/5 backdrop-blur-sm rounded-t-3xl -mx-6 -mt-6 px-6 pt-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-white/20 shadow-lg">
              <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            {agent ? "Editar Agente de IA" : "Criar Novo Agente de IA"}
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-base">
            Configure seu assistente inteligente para automatizar conversas e processos
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/30 dark:bg-white/10 backdrop-blur-md p-1.5 rounded-2xl h-16 border border-white/40 dark:border-white/20 shadow-lg">
              <TabsTrigger 
                value="basic" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-white/50 rounded-xl py-3 px-4 transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/15"
              >
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Informações Básicas</span>
                <span className="sm:hidden">Básico</span>
              </TabsTrigger>
              <TabsTrigger 
                value="prompt" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-white/50 rounded-xl py-3 px-4 transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/15"
                disabled={!currentAgent && !agent}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Configuração do Prompt</span>
                <span className="sm:hidden">Prompt</span>
              </TabsTrigger>
              <TabsTrigger 
                value="objectives" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-white/50 rounded-xl py-3 px-4 transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/15"
                disabled={!currentAgent && !agent}
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Objetivos</span>
                <span className="sm:hidden">Metas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-0">
              <Card className="bg-white/60 dark:bg-white/10 backdrop-blur-lg border-0 shadow-xl rounded-2xl ring-1 ring-white/30 dark:ring-white/20 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm border-b border-white/20 dark:border-white/10 rounded-t-2xl">
                  <CardTitle className="flex items-center gap-3 text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl border border-white/30 dark:border-white/20">
                      <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Informações Básicas do Agente
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Configure as informações fundamentais do seu agente de IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/2 backdrop-blur-sm rounded-b-2xl">
                  <AIAgentForm 
                    agent={agent} 
                    onSave={handleAgentSaved}
                    onCancel={handleClose}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompt" className="mt-0">
              <Card className="bg-white/60 dark:bg-white/10 backdrop-blur-lg border-0 shadow-xl rounded-2xl ring-1 ring-white/30 dark:ring-white/20 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-50/80 to-blue-50/80 dark:from-green-900/20 dark:to-blue-900/20 backdrop-blur-sm border-b border-white/20 dark:border-white/10 rounded-t-2xl">
                  <CardTitle className="flex items-center gap-3 text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl border border-white/30 dark:border-white/20">
                      <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    Configuração do Prompt
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Defina como seu agente deve se comunicar e comportar
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/2 backdrop-blur-sm rounded-b-2xl">
                  <PromptConfiguration 
                    agent={currentAgent || agent} 
                    onSave={handleSave}
                    onCancel={handleClose}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="objectives" className="mt-0">
              <Card className="bg-white/60 dark:bg-white/10 backdrop-blur-lg border-0 shadow-xl rounded-2xl ring-1 ring-white/30 dark:ring-white/20 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm border-b border-white/20 dark:border-white/10 rounded-t-2xl">
                  <CardTitle className="flex items-center gap-3 text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl border border-white/30 dark:border-white/20">
                      <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Objetivos do Agente
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Configure os passos que o agente deve seguir para atingir seus objetivos
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/2 backdrop-blur-sm rounded-b-2xl">
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
