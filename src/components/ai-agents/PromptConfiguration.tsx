
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAgent } from "@/types/aiAgent";
import { useAIAgentPrompts } from "@/hooks/useAIAgentPrompts";
import { ObjectivesList } from "./ObjectivesList";
import { User, MessageSquare, Building, Package, AlertTriangle, Target } from "lucide-react";

interface PromptConfigurationProps {
  agent?: AIAgent | null;
  onSave: () => void;
  onCancel: () => void;
  focusObjectives?: boolean;
}

export const PromptConfiguration = ({ agent, onSave, onCancel, focusObjectives = false }: PromptConfigurationProps) => {
  const { createPrompt, updatePrompt, getPromptByAgentId } = useAIAgentPrompts();
  const [isLoading, setIsLoading] = useState(false);
  const [existingPrompt, setExistingPrompt] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    agent_function: "",
    communication_style: "",
    company_info: "",
    product_service_info: "",
    prohibitions: "",
    objectives: [] as string[]
  });

  useEffect(() => {
    if (agent?.id) {
      const fetchPrompt = async () => {
        const prompt = await getPromptByAgentId(agent.id);
        if (prompt) {
          setExistingPrompt(prompt);
          setFormData({
            agent_function: prompt.agent_function || "",
            communication_style: prompt.communication_style || "",
            company_info: prompt.company_info || "",
            product_service_info: prompt.product_service_info || "",
            prohibitions: prompt.prohibitions || "",
            objectives: prompt.objectives || []
          });
        }
      };
      fetchPrompt();
    }
  }, [agent?.id, getPromptByAgentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent?.id) return;

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

  if (focusObjectives) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl transition-all duration-300 hover:bg-white/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <Target className="h-6 w-6 text-yellow-500" />
            Objetivos do Agente
          </CardTitle>
            <CardDescription className="text-gray-700 font-medium">
            Configure os passos específicos que o agente deve seguir
          </CardDescription>
        </CardHeader>
        <CardContent>
            <ObjectivesList 
              objectives={formData.objectives}
              onChange={handleObjectivesChange}
            />
          </CardContent>
        </Card>
            
        <form onSubmit={handleSubmit}>
          <div className="flex justify-end gap-3 pt-6 border-t border-white/30">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="px-6 h-11 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
              className="px-8 h-11 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl shadow-glass hover:shadow-glass-lg transition-all duration-200"
              >
                {isLoading ? "Salvando..." : "Salvar Objetivos"}
              </Button>
            </div>
          </form>
      </div>
    );
  }

  return (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Função do Agente */}
            <div className="md:col-span-2">
              <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl transition-all duration-300 hover:bg-white/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <User className="h-5 w-5 text-yellow-500" />
                    Função do Agente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.agent_function}
                    onChange={(e) => setFormData({ ...formData, agent_function: e.target.value })}
                    placeholder="Ex: Você é um assistente de vendas especializado em produtos tecnológicos..."
                    className="min-h-20 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg"
                    required
                  />
                </CardContent>
              </Card>
            </div>

            {/* Estilo de Comunicação */}
            <div className="md:col-span-2">
              <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl transition-all duration-300 hover:bg-white/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <MessageSquare className="h-5 w-5 text-yellow-500" />
                    Estilo de Comunicação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.communication_style}
                    onChange={(e) => setFormData({ ...formData, communication_style: e.target.value })}
                    placeholder="Ex: Comunicação amigável, profissional, com linguagem clara e objetiva..."
                    className="min-h-20 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg"
                    required
                  />
                </CardContent>
              </Card>
            </div>

            {/* Informações da Empresa */}
            <div>
              <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl h-full transition-all duration-300 hover:bg-white/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <Building className="h-5 w-5 text-yellow-500" />
                    Informações da Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.company_info}
                    onChange={(e) => setFormData({ ...formData, company_info: e.target.value })}
                    placeholder="Informações sobre sua empresa, história, valores..."
                    className="min-h-24 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Produtos/Serviços */}
            <div>
              <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl h-full transition-all duration-300 hover:bg-white/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <Package className="h-5 w-5 text-yellow-500" />
                    Produtos/Serviços
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.product_service_info}
                    onChange={(e) => setFormData({ ...formData, product_service_info: e.target.value })}
                    placeholder="Descrição detalhada dos produtos ou serviços oferecidos..."
                    className="min-h-24 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Proibições */}
            <div className="md:col-span-2">
              <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl transition-all duration-300 hover:bg-white/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Proibições e Limitações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.prohibitions}
                    onChange={(e) => setFormData({ ...formData, prohibitions: e.target.value })}
                    placeholder="Ex: Não forneça informações sobre preços sem consultar um vendedor, não faça promessas de desconto..."
                    className="min-h-20 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-white/30">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="px-6 h-11 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
          className="px-8 h-11 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl shadow-glass hover:shadow-glass-lg transition-all duration-200"
            >
              {isLoading ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </div>
        </form>
  );
};
