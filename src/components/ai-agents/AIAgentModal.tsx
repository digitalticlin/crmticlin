
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIAgent } from "@/types/aiAgent";
import { AIAgentForm } from "./AIAgentForm";
import { PromptConfiguration } from "./PromptConfiguration";
import { Bot, MessageSquare, Target } from "lucide-react";

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {agent ? "Editar Agente de IA" : "Criar Novo Agente de IA"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Informações Básicas
            </TabsTrigger>
            <TabsTrigger 
              value="prompt" 
              className="flex items-center gap-2"
              disabled={!currentAgent && !agent}
            >
              <MessageSquare className="h-4 w-4" />
              Configuração do Prompt
            </TabsTrigger>
            <TabsTrigger 
              value="objectives" 
              className="flex items-center gap-2"
              disabled={!currentAgent && !agent}
            >
              <Target className="h-4 w-4" />
              Objetivos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <AIAgentForm 
              agent={agent} 
              onSave={handleAgentSaved}
              onCancel={handleClose}
            />
          </TabsContent>

          <TabsContent value="prompt" className="mt-6">
            <PromptConfiguration 
              agent={currentAgent || agent} 
              onSave={handleSave}
              onCancel={handleClose}
            />
          </TabsContent>

          <TabsContent value="objectives" className="mt-6">
            <PromptConfiguration 
              agent={currentAgent || agent} 
              onSave={handleSave}
              onCancel={handleClose}
              focusObjectives={true}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
