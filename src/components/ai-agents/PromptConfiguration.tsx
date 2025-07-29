
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAgent } from "@/types/aiAgent";
import { useAIAgentPrompts } from "@/hooks/useAIAgentPrompts";
import { ObjectivesList } from "./ObjectivesList";
import { User, MessageSquare, Building, Package, AlertTriangle, ListChecks } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface PromptConfigurationProps {
  agent?: AIAgent | null;
  promptData: {
    agent_function: string;
    communication_style: string;
    company_info: string;
    product_service_info: string;
    prohibitions: string;
    objectives: string[];
  };
  onPromptDataChange: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  focusObjectives?: boolean;
}

export const PromptConfiguration = ({ 
  agent, 
  promptData, 
  onPromptDataChange, 
  onSave, 
  onCancel, 
  focusObjectives = false 
}: PromptConfigurationProps) => {
  const { createPrompt, updatePrompt, getPromptByAgentId } = useAIAgentPrompts();
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  // Auto-save debounced function
  const debouncedAutoSave = useCallback(
    async (data: typeof promptData) => {
      if (!agent?.id) return;
      
      setAutoSaving(true);
      try {
        const existingPrompt = await getPromptByAgentId(agent.id);
        
        if (existingPrompt) {
          await updatePrompt(existingPrompt.id, data);
        } else {
          await createPrompt({
            agent_id: agent.id,
            ...data
          });
        }
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        setAutoSaving(false);
      }
    },
    [agent?.id, createPrompt, updatePrompt, getPromptByAgentId]
  );

  // Auto-save effect with debounce
  useEffect(() => {
    if (!agent?.id) return;
    
    const timeoutId = setTimeout(() => {
      // Only auto-save if there's actual data
      const hasData = promptData.agent_function || 
                     promptData.communication_style || 
                     promptData.company_info || 
                     promptData.product_service_info || 
                     promptData.prohibitions || 
                     promptData.objectives.length > 0;
      
      if (hasData) {
        debouncedAutoSave(promptData);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [promptData, agent?.id, debouncedAutoSave]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent?.id) return;

    setIsLoading(true);
    try {
      const existingPrompt = await getPromptByAgentId(agent.id);
      
      if (existingPrompt) {
        await updatePrompt(existingPrompt.id, promptData);
      } else {
        await createPrompt({
          agent_id: agent.id,
          ...promptData
        });
      }
      toast.success('Configuração salva com sucesso!');
      onSave();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsLoading(false);
    }
  };

  const handleObjectivesChange = (objectives: string[]) => {
    onPromptDataChange('objectives', objectives);
  };

  if (focusObjectives) {
    return (
      <div className="space-y-4">
        <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-lg transition-all duration-300 hover:bg-white/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <ListChecks className="h-5 w-5 text-yellow-500" />
              Fluxo de Conversação
              {autoSaving && (
                <span className="text-xs text-yellow-600 ml-auto">Salvando...</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ObjectivesList 
              objectives={promptData.objectives}
              onChange={handleObjectivesChange}
            />
          </CardContent>
        </Card>
            
        <form onSubmit={handleSubmit}>
          <div className="flex justify-end gap-2 pt-4 border-t border-white/30">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="px-4 h-9 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-lg text-sm"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="px-6 h-9 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-glass hover:shadow-glass-lg transition-all duration-200 text-sm"
            >
              {isLoading ? "Salvando..." : "Salvar Fluxo"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {autoSaving && (
        <div className="text-xs text-yellow-600 text-right mb-2">
          Salvando automaticamente...
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Função do Agente */}
        <div className="md:col-span-2">
          <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-lg transition-all duration-300 hover:bg-white/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                <User className="h-4 w-4 text-yellow-500" />
                Função do Agente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={promptData.agent_function}
                onChange={(e) => onPromptDataChange('agent_function', e.target.value)}
                placeholder="Ex: Você é um assistente de vendas especializado em produtos tecnológicos..."
                className="min-h-16 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg text-sm"
                required
              />
            </CardContent>
          </Card>
        </div>

        {/* Estilo de Comunicação */}
        <div className="md:col-span-2">
          <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-lg transition-all duration-300 hover:bg-white/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                <MessageSquare className="h-4 w-4 text-yellow-500" />
                Estilo de Comunicação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={promptData.communication_style}
                onChange={(e) => onPromptDataChange('communication_style', e.target.value)}
                placeholder="Ex: Comunicação amigável, profissional, com linguagem clara e objetiva..."
                className="min-h-16 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg text-sm"
                required
              />
            </CardContent>
          </Card>
        </div>

        {/* Informações da Empresa */}
        <div>
          <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-lg h-full transition-all duration-300 hover:bg-white/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                <Building className="h-4 w-4 text-yellow-500" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={promptData.company_info}
                onChange={(e) => onPromptDataChange('company_info', e.target.value)}
                placeholder="Informações sobre sua empresa, história, valores..."
                className="min-h-20 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg text-sm"
              />
            </CardContent>
          </Card>
        </div>

        {/* Produtos/Serviços */}
        <div>
          <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-lg h-full transition-all duration-300 hover:bg-white/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                <Package className="h-4 w-4 text-yellow-500" />
                Produtos/Serviços
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={promptData.product_service_info}
                onChange={(e) => onPromptDataChange('product_service_info', e.target.value)}
                placeholder="Descrição detalhada dos produtos ou serviços oferecidos..."
                className="min-h-20 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg text-sm"
              />
            </CardContent>
          </Card>
        </div>

        {/* Proibições */}
        <div className="md:col-span-2">
          <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-lg transition-all duration-300 hover:bg-white/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Proibições e Limitações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={promptData.prohibitions}
                onChange={(e) => onPromptDataChange('prohibitions', e.target.value)}
                placeholder="Ex: Não forneça informações sobre preços sem consultar um vendedor, não faça promessas de desconto..."
                className="min-h-16 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg text-sm"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-white/30">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="px-4 h-9 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-lg transition-all duration-200 text-sm"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="px-6 h-9 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-glass hover:shadow-glass-lg transition-all duration-200 text-sm"
        >
          {isLoading ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </div>
    </form>
  );
};
