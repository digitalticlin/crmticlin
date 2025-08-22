
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AIAgent } from "@/types/aiAgent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AIAgentFormProps {
  onSuccess?: () => void;
}

export function AIAgentForm({ onSuccess }: AIAgentFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    funnel_id: "",
    whatsapp_number_id: "",
  });
  const [funnels, setFunnels] = useState<any[]>([]);
  const [whatsappInstances, setWhatsappInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFunnels();
    loadWhatsAppInstances();
  }, []);

  const loadFunnels = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('funnels')
      .select('id, name')
      .eq('created_by_user_id', user.id);

    if (error) {
      console.error('Erro ao carregar funis:', error);
      return;
    }

    setFunnels(data || []);
  };

  const loadWhatsAppInstances = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name')
      .eq('created_by_user_id', user.id)
      .eq('connection_status', 'connected');

    if (error) {
      console.error('Erro ao carregar instâncias WhatsApp:', error);
      return;
    }

    // Criar agentes completos com propriedades obrigatórias
    const completeAgents: AIAgent[] = (data || []).map(item => ({
      id: item.id,
      name: item.instance_name,
      funnel_id: '',
      whatsapp_number_id: item.id,
      type: 'assistant',
      status: 'active',
      messages_count: 0,
      created_by_user_id: user?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    setWhatsappInstances(completeAgents);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('ai_agents')
        .insert({
          ...formData,
          type: 'assistant',
          status: 'active',
          created_by_user_id: user.id,
        });

      if (error) throw error;

      toast.success('Agente IA criado com sucesso!');
      setFormData({ name: "", funnel_id: "", whatsapp_number_id: "" });
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      toast.error('Erro ao criar agente IA');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Agente</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Digite o nome do agente"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="funnel">Funil</Label>
        <Select value={formData.funnel_id} onValueChange={(value) => setFormData(prev => ({ ...prev, funnel_id: value }))}>
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

      <div className="space-y-2">
        <Label htmlFor="whatsapp">Instância WhatsApp</Label>
        <Select value={formData.whatsapp_number_id} onValueChange={(value) => setFormData(prev => ({ ...prev, whatsapp_number_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma instância" />
          </SelectTrigger>
          <SelectContent>
            {whatsappInstances.map((instance) => (
              <SelectItem key={instance.id} value={instance.id}>
                {instance.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Criando...' : 'Criar Agente IA'}
      </Button>
    </form>
  );
}
