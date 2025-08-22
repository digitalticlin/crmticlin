import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AIAgent, CreateAIAgentData } from "@/types/aiAgent";
import { Funnel } from "@/types/funnel";
import { supabase } from "@/integrations/supabase/client";

interface AIAgentFormProps {
  agent?: AIAgent;
  onSubmit: (data: CreateAIAgentData) => void;
  onCancel: () => void;
}

export const AIAgentForm = ({ agent, onSubmit, onCancel }: AIAgentFormProps) => {
  const [formData, setFormData] = useState({
    name: agent?.name || "",
    type: agent?.type || "attendance",
    funnel_id: agent?.funnel_id || null,
    whatsapp_number_id: agent?.whatsapp_number_id || null,
  });
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [instances, setInstances] = useState<AIAgent[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value === "null" ? null : value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [funnelsData, instancesData] = await Promise.all([
          supabase.from('funnels').select('id, name'),
          supabase.from('whatsapp_instances').select('id, name, phone_number, status')
        ]);

        if (funnelsData.data) {
          setFunnels(funnelsData.data);
        }

        if (instancesData.data) {
          // Corrigido: mapear para o formato correto de AIAgent
          const mappedInstances = instancesData.data.map(instance => ({
            id: instance.id,
            name: instance.name,
            type: 'attendance' as const,
            status: 'active' as const,
            funnel_id: null,
            whatsapp_number_id: instance.id,
            messages_count: 0,
            created_by_user_id: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          setInstances(mappedInstances);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nome do Agente"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
          <SelectTrigger className="text-black">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="attendance">Atendimento</SelectItem>
            <SelectItem value="sales">Vendas</SelectItem>
            <SelectItem value="support">Suporte</SelectItem>
            <SelectItem value="custom">Customizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="funnel_id">Funil</Label>
        <Select value={formData.funnel_id || "null"} onValueChange={(value) => handleSelectChange("funnel_id", value)}>
          <SelectTrigger className="text-black">
            <SelectValue placeholder="Selecione o funil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Nenhum</SelectItem>
            {funnels.map((funnel) => (
              <SelectItem key={funnel.id} value={funnel.id}>
                {funnel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp_number_id">Instância WhatsApp</Label>
        <Select value={formData.whatsapp_number_id || "null"} onValueChange={(value) => handleSelectChange("whatsapp_number_id", value)}>
          <SelectTrigger className="text-black">
            <SelectValue placeholder="Selecione a instância" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Nenhuma</SelectItem>
            {instances.map((instance) => (
              <SelectItem key={instance.id} value={instance.id}>
                {instance.name} ({instance.whatsapp_number_id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {agent ? "Atualizar Agente" : "Criar Agente"}
        </Button>
      </div>
    </form>
  );
};
