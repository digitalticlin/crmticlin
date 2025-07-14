
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="bg-white/40 backdrop-blur-sm border border-white/20 shadow-sm rounded-xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Nome do Agente */}
            <div>
              <Label htmlFor="name" className="text-base font-semibold text-gray-700 mb-2 block">
                Nome do Agente *
              </Label>
              <div className="relative">
                <Bot className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Assistente de Vendas Premium"
                  className="pl-10 h-12 bg-white/60 backdrop-blur-sm border border-white/30 focus:border-blue-500 rounded-xl"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Escolha um nome descritivo para seu agente</p>
            </div>

            {/* Funil */}
            <div>
              <Label htmlFor="funnel" className="text-base font-semibold text-gray-700 mb-2 block">
                Funil (Opcional)
              </Label>
              <div className="relative">
                <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                <Select
                  value={formData.funnel_id}
                  onValueChange={(value) => setFormData({ ...formData, funnel_id: value })}
                >
                  <SelectTrigger className="pl-10 h-12 bg-white/60 backdrop-blur-sm border border-white/30 focus:border-blue-500 rounded-xl">
                    <SelectValue placeholder="Selecione um funil" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 backdrop-blur-md border border-white/20 rounded-xl">
                    {funnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        {funnel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-gray-500 mt-1">Conecte o agente a um funil específico</p>
            </div>

            {/* Instância WhatsApp */}
            <div>
              <Label htmlFor="whatsapp" className="text-base font-semibold text-gray-700 mb-2 block">
                Instância WhatsApp (Opcional)
              </Label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                <Select
                  value={formData.whatsapp_number_id}
                  onValueChange={(value) => setFormData({ ...formData, whatsapp_number_id: value })}
                >
                  <SelectTrigger className="pl-10 h-12 bg-white/60 backdrop-blur-sm border border-white/30 focus:border-blue-500 rounded-xl">
                    <SelectValue placeholder="Selecione uma instância" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 backdrop-blur-md border border-white/20 rounded-xl">
                    {whatsappInstances.map((instance) => (
                      <SelectItem key={instance.id} value={instance.id}>
                        {instance.profile_name || instance.instance_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-gray-500 mt-1">Conecte o agente a uma instância do WhatsApp</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
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
              className="px-8 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? "Salvando..." : agent ? "Atualizar Agente" : "Criar Agente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
