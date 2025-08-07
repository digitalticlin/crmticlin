
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIAgent, CreateAIAgentData } from "@/types/aiAgent";
import { useAIAgents } from "@/hooks/useAIAgents";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Link, MessageCircle } from "lucide-react";

interface AIAgentFormProps {
  agent?: AIAgent | null;
  onSave: (agent: AIAgent) => void;
  onCancel: () => void;
}

export const AIAgentForm = ({ agent, onSave, onCancel }: AIAgentFormProps) => {
  const { createAgent, updateAgent } = useAIAgents();
  const [isLoading, setIsLoading] = useState(false);
  const [funnels, setFunnels] = useState<any[]>([]);
  const [whatsappInstances, setWhatsappInstances] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<CreateAIAgentData>({
    name: agent?.name || "",
    type: agent?.type || "sales",
    funnel_id: agent?.funnel_id || undefined,
    whatsapp_number_id: agent?.whatsapp_number_id || undefined,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [funnelsRes, instancesRes] = await Promise.all([
          supabase.from('funnels').select('id, name'),
          supabase.from('whatsapp_instances').select('id, instance_name, profile_name')
        ]);

        if (funnelsRes.data) setFunnels(funnelsRes.data);
        if (instancesRes.data) setWhatsappInstances(instancesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (agent) {
        const success = await updateAgent(agent.id, formData);
        if (success) {
          const updatedAgent = { ...agent, ...formData };
          onSave(updatedAgent);
        }
      } else {
        const newAgent = await createAgent(formData);
        if (newAgent) {
          onSave(newAgent);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Nome do Agente */}
      <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl transition-all duration-300 hover:bg-white/50">
      <CardContent className="p-6">
          <Label htmlFor="name" className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Bot className="h-5 w-5 text-yellow-500" />
                Nome do Agente *
              </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Assistente de Vendas Premium"
            className="h-12 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-xl"
                  required
                />
          <p className="text-sm text-gray-600 mt-2 font-medium">Escolha um nome descritivo para seu agente</p>
        </CardContent>
      </Card>

            {/* Funil */}
      <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl transition-all duration-300 hover:bg-white/50">
        <CardContent className="p-6">
          <Label htmlFor="funnel" className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Link className="h-5 w-5 text-yellow-500" />
                Funil (Opcional)
              </Label>
                <Select
                  value={formData.funnel_id}
                  onValueChange={(value) => setFormData({ ...formData, funnel_id: value })}
                >
            <SelectTrigger className="h-12 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-xl">
                    <SelectValue placeholder="Selecione um funil" />
                  </SelectTrigger>
            <SelectContent className="bg-white/90 backdrop-blur-md border border-white/30 rounded-xl shadow-glass">
                    {funnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        {funnel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
          <p className="text-sm text-gray-600 mt-2 font-medium">Conecte o agente a um funil específico</p>
        </CardContent>
      </Card>

            {/* Instância WhatsApp */}
      <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl transition-all duration-300 hover:bg-white/50">
        <CardContent className="p-6">
          <Label htmlFor="whatsapp" className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-yellow-500" />
                Instância WhatsApp (Opcional)
              </Label>
                <Select
                  value={formData.whatsapp_number_id}
                  onValueChange={(value) => setFormData({ ...formData, whatsapp_number_id: value })}
                >
            <SelectTrigger className="h-12 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-xl">
                    <SelectValue placeholder="Selecione uma instância" />
                  </SelectTrigger>
            <SelectContent className="bg-white/90 backdrop-blur-md border border-white/30 rounded-xl shadow-glass">
                    {whatsappInstances.map((instance) => (
                      <SelectItem key={instance.id} value={instance.id}>
                        {instance.profile_name || instance.instance_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
          <p className="text-sm text-gray-600 mt-2 font-medium">Conecte o agente a uma instância do WhatsApp</p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <div className="flex justify-end gap-3 pt-6 border-t border-white/30">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="px-6 h-11 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl transition-all duration-200"
            >
              Fechar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
            className="px-8 h-11 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl shadow-glass hover:shadow-glass-lg transition-all duration-200"
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
    </div>
  );
};
