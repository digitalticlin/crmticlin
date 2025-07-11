
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAgent, AIAgentPrompt } from "@/types/aiAgent";
import { useAIAgentPrompts } from "@/hooks/useAIAgentPrompts";
import { ObjectivesList } from "./ObjectivesList";
import { MessageSquare, Building2, Package, ShieldX, Target } from "lucide-react";

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
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Agente não selecionado</h3>
        <p className="text-gray-600">Primeiro configure as informações básicas do agente.</p>
      </div>
    );
  }

  if (focusObjectives) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500 rounded-lg text-white">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Objetivos do Agente</h3>
              <p className="text-gray-600">Configure os passos que o agente deve seguir para atingir seus objetivos</p>
            </div>
          </div>
        </div>

        <Card className="border-2 border-gray-100">
          <CardContent className="p-6">
            <ObjectivesList 
              objectives={formData.objectives}
              onChange={handleObjectivesChange}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="px-6 h-11 border-2 border-gray-300 hover:bg-gray-50 rounded-xl"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => handleSubmit(new Event('submit') as any)}
            disabled={isLoading} 
            className="px-8 h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? "Salvando..." : "Salvar Objetivos"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Função do Agente */}
        <div className="lg:col-span-2">
          <Card className="border-2 border-green-100 bg-green-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <MessageSquare className="h-5 w-5" />
                Função do Agente *
              </CardTitle>
              <CardDescription className="text-green-700">
                Descreva qual é o papel principal do seu agente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="agent_function"
                value={formData.agent_function}
                onChange={(e) => setFormData({ ...formData, agent_function: e.target.value })}
                placeholder="Ex: Você é um vendedor especializado em produtos de tecnologia, responsável por identificar necessidades dos clientes e apresentar soluções adequadas..."
                required
                rows={4}
                className="resize-none border-2 border-gray-200 focus:border-green-500 rounded-xl"
              />
            </CardContent>
          </Card>
        </div>

        {/* Estilo de Comunicação */}
        <div className="lg:col-span-2">
          <Card className="border-2 border-blue-100 bg-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <MessageSquare className="h-5 w-5" />
                Estilo de Comunicação *
              </CardTitle>
              <CardDescription className="text-blue-700">
                Defina como o agente deve se comunicar com os clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="communication_style"
                value={formData.communication_style}
                onChange={(e) => setFormData({ ...formData, communication_style: e.target.value })}
                placeholder="Ex: Use uma comunicação amigável, profissional e direta. Seja empático e sempre responda de forma clara e objetiva..."
                required
                rows={4}
                className="resize-none border-2 border-gray-200 focus:border-blue-500 rounded-xl"
              />
            </CardContent>
          </Card>
        </div>

        {/* Informações da Empresa */}
        <div>
          <Card className="border-2 border-purple-100 bg-purple-50/30 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Building2 className="h-5 w-5" />
                Informações da Empresa
              </CardTitle>
              <CardDescription className="text-purple-700">
                Contexto sobre sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="company_info"
                value={formData.company_info}
                onChange={(e) => setFormData({ ...formData, company_info: e.target.value })}
                placeholder="Descreva sua empresa, missão, valores, história..."
                rows={5}
                className="resize-none border-2 border-gray-200 focus:border-purple-500 rounded-xl"
              />
            </CardContent>
          </Card>
        </div>

        {/* Informações sobre Produto/Serviço */}
        <div>
          <Card className="border-2 border-orange-100 bg-orange-50/30 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Package className="h-5 w-5" />
                Produtos/Serviços
              </CardTitle>
              <CardDescription className="text-orange-700">
                Detalhes dos produtos oferecidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="product_service_info"
                value={formData.product_service_info}
                onChange={(e) => setFormData({ ...formData, product_service_info: e.target.value })}
                placeholder="Descreva os produtos/serviços oferecidos, preços, benefícios..."
                rows={5}
                className="resize-none border-2 border-gray-200 focus:border-orange-500 rounded-xl"
              />
            </CardContent>
          </Card>
        </div>

        {/* Proibições */}
        <div className="lg:col-span-2">
          <Card className="border-2 border-red-100 bg-red-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <ShieldX className="h-5 w-5" />
                Proibições do Agente
              </CardTitle>
              <CardDescription className="text-red-700">
                Defina o que o agente NÃO deve fazer ou falar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="prohibitions"
                value={formData.prohibitions}
                onChange={(e) => setFormData({ ...formData, prohibitions: e.target.value })}
                placeholder="Ex: Nunca forneça informações de preços sem antes qualificar o cliente. Não prometa descontos sem autorização..."
                rows={3}
                className="resize-none border-2 border-gray-200 focus:border-red-500 rounded-xl"
              />
            </CardContent>
          </Card>
        </div>

        {/* Objetivos */}
        <div className="lg:col-span-2">
          <Card className="border-2 border-indigo-100 bg-indigo-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <Target className="h-5 w-5" />
                Objetivos do Agente
              </CardTitle>
              <CardDescription className="text-indigo-700">
                Configure os passos que o agente deve seguir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ObjectivesList 
                objectives={formData.objectives}
                onChange={handleObjectivesChange}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="px-6 h-11 border-2 border-gray-300 hover:bg-gray-50 rounded-xl"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="px-8 h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isLoading ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </div>
    </form>
  );
};
