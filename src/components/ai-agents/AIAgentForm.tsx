
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIAgent, CreateAIAgentData } from "@/types/aiAgent";
import { useAIAgents } from "@/hooks/useAIAgents";
import { supabase } from "@/integrations/supabase/client";

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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'attendance': return 'Atendimento';
      case 'sales': return 'Vendas';
      case 'support': return 'Suporte';
      case 'custom': return 'Personalizado';
      default: return type;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Agente *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Assistente de Vendas"
            required
          />
        </div>

        <div>
          <Label htmlFor="type">Tipo do Agente *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: any) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attendance">Atendimento</SelectItem>
              <SelectItem value="sales">Vendas</SelectItem>
              <SelectItem value="support">Suporte</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="funnel">Funil (Opcional)</Label>
          <Select
            value={formData.funnel_id}
            onValueChange={(value) => setFormData({ ...formData, funnel_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um funil" />
            </SelectTrigger>
            <SelectContent>
              {funnels.map((funnel) => (
                <SelectItem key={funnel.id} value={funnel.id}>
                  {funnel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="whatsapp">Instância WhatsApp (Opcional)</Label>
          <Select
            value={formData.whatsapp_number_id}
            onValueChange={(value) => setFormData({ ...formData, whatsapp_number_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma instância" />
            </SelectTrigger>
            <SelectContent>
              {whatsappInstances.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  {instance.profile_name || instance.instance_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-ticlin hover:bg-ticlin/90 text-black">
          {isLoading ? "Salvando..." : agent ? "Atualizar" : "Criar Agente"}
        </Button>
      </div>
    </form>
  );
};
