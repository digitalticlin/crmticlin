
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AIAgent, AIAgentPrompt } from "@/types/aiAgent";
import { useAIAgentPrompts } from "@/hooks/useAIAgentPrompts";
import { ObjectivesList } from "./ObjectivesList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PromptConfigurationProps {
  agent?: AIAgent | null;
  onSave: () => void;
  onCancel: () => void;
  focusObjectives?: boolean;
}

export const PromptConfiguration = ({ agent, onSave, onCancel, focusObjectives = false }: PromptConfigurationProps) => {
  const { createPrompt, updatePrompt, getPromptByAgentId } = useAIAgentPrompts();
  const [isLoading, setIsLoading] = useState(false);
  const [existingPrompt, setExistingPrompt] = useState<AIAgentPrompt | null>(null);
  
  const [formData, setFormData] = useState({
    agent_function: "",
    communication_style: "",
    company_info: "",
    product_service_info: "",
    prohibitions: "",
    objectives: [] as string[]
  });

  useEffect(() => {
    if (agent) {
      loadExistingPrompt();
    }
  }, [agent]);

  const loadExistingPrompt = async () => {
    if (!agent) return;
    
    try {
      const prompt = await getPromptByAgentId(agent.id);
      if (prompt) {
        setExistingPrompt(prompt);
        setFormData({
          agent_function: prompt.agent_function,
          communication_style: prompt.communication_style,
          company_info: prompt.company_info || "",
          product_service_info: prompt.product_service_info || "",
          prohibitions: prompt.prohibitions || "",
          objectives: prompt.objectives || []
        });
      }
    } catch (error) {
      console.error('Error loading existing prompt:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;

    setIsLoading(true);

    try {
      if (existingPrompt) {
        await updatePrompt(existingPrompt.id, formData);
      } else {
        await createPrompt({
          agent_id: agent.id,
          ...formData
        });
      }
      onSave();
    } finally {
      setIsLoading(false);
    }
  };

  const handleObjectivesChange = (objectives: string[]) => {
    setFormData({ ...formData, objectives });
  };

  if (!agent) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Selecione um agente para configurar o prompt.</p>
      </div>
    );
  }

  if (focusObjectives) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Objetivos do Agente</CardTitle>
            <CardDescription>
              Configure os passos que o agente deve seguir para atingir seus objetivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ObjectivesList 
              objectives={formData.objectives}
              onChange={handleObjectivesChange}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={() => handleSubmit(new Event('submit') as any)}
            disabled={isLoading} 
            className="bg-ticlin hover:bg-ticlin/90 text-black"
          >
            {isLoading ? "Salvando..." : "Salvar Objetivos"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="agent_function">Função do Agente *</Label>
          <Textarea
            id="agent_function"
            value={formData.agent_function}
            onChange={(e) => setFormData({ ...formData, agent_function: e.target.value })}
            placeholder="Ex: Você é um vendedor especializado em produtos de tecnologia..."
            required
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="communication_style">Estilo de Comunicação *</Label>
          <Textarea
            id="communication_style"
            value={formData.communication_style}
            onChange={(e) => setFormData({ ...formData, communication_style: e.target.value })}
            placeholder="Ex: Comunicação amigável, profissional e direta..."
            required
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="company_info">Informações sobre a Empresa</Label>
          <Textarea
            id="company_info"
            value={formData.company_info}
            onChange={(e) => setFormData({ ...formData, company_info: e.target.value })}
            placeholder="Descreva sua empresa, missão, valores..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="product_service_info">Informações sobre Produto/Serviço</Label>
          <Textarea
            id="product_service_info"
            value={formData.product_service_info}
            onChange={(e) => setFormData({ ...formData, product_service_info: e.target.value })}
            placeholder="Descreva os produtos/serviços oferecidos..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="prohibitions">Proibições do Agente</Label>
          <Textarea
            id="prohibitions"
            value={formData.prohibitions}
            onChange={(e) => setFormData({ ...formData, prohibitions: e.target.value })}
            placeholder="O que o agente NÃO deve fazer ou falar..."
            rows={3}
          />
        </div>

        <div>
          <Label>Objetivos do Agente</Label>
          <ObjectivesList 
            objectives={formData.objectives}
            onChange={handleObjectivesChange}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-ticlin hover:bg-ticlin/90 text-black">
          {isLoading ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </div>
    </form>
  );
};
