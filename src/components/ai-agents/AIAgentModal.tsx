
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Settings, MessageSquare, Save, X } from 'lucide-react';
import { AIAgent, AIAgentPrompt } from '@/types/aiAgent';
import { AIAgentForm } from './AIAgentForm';
import { EnhancedPromptConfiguration } from './EnhancedPromptConfiguration';
import { toast } from 'sonner';

interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AIAgent;
  onAgentSaved?: (agent: AIAgent) => void;
}

export const AIAgentModal = ({ 
  isOpen, 
  onClose, 
  agent, 
  onAgentSaved 
}: AIAgentModalProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AIAgent | undefined>(agent);

  const isEditMode = Boolean(agent);
  const modalTitle = isEditMode ? `Editar Agente: ${agent?.name}` : 'Criar Novo Agente de IA';

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = confirm('Você tem alterações não salvas. Deseja realmente fechar?');
      if (!confirmClose) return;
    }
    setHasChanges(false);
    onClose();
  };

  const handleAgentSave = async (savedAgent: AIAgent) => {
    setCurrentAgent(savedAgent);
    setHasChanges(false);
    if (onAgentSaved) {
      onAgentSaved(savedAgent);
    }
    toast.success('Agente salvo com sucesso!');
  };

  const handlePromptSave = async () => {
    // This function will be called when the prompt configuration is saved
    setHasChanges(false);
    toast.success('Configuração de prompt salva com sucesso!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden bg-white/95 backdrop-blur-lg border border-white/20">
        <DialogHeader className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              {modalTitle}
              {hasChanges && (
                <Badge variant="secondary" className="ml-2">
                  Não salvo
                </Badge>
              )}
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mx-6 mt-4 bg-white/50 backdrop-blur-sm">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configurações Básicas
              </TabsTrigger>
              <TabsTrigger 
                value="prompt" 
                className="flex items-center gap-2"
                disabled={!currentAgent}
              >
                <MessageSquare className="w-4 h-4" />
                Configuração de Prompt
                {!currentAgent && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Salve primeiro
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto px-6 pb-6">
              <TabsContent value="basic" className="mt-6 space-y-6">
                <AIAgentForm
                  agent={agent}
                  onSave={handleAgentSave}
                  onCancel={handleClose}
                  onFormChange={setHasChanges}
                />
              </TabsContent>

              <TabsContent value="prompt" className="mt-6 space-y-6">
                {currentAgent ? (
                  <EnhancedPromptConfiguration
                    agent={currentAgent}
                    onSave={handlePromptSave}
                    onCancel={handleClose}
                    onFormChange={setHasChanges}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Salve as configurações básicas primeiro para acessar a configuração de prompt.
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
