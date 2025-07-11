
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAgent, CreateAIAgentData } from "@/types/aiAgent";
import { useAIAgents } from "@/hooks/useAIAgents";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Zap, Link, MessageCircle, Users, Headphones, Settings } from "lucide-react";

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'attendance': return <Users className="h-4 w-4" />;
      case 'sales': return <Zap className="h-4 w-4" />;
      case 'support': return <Headphones className="h-4 w-4" />;
      case 'custom': return <Settings className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
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

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'attendance': return 'Primeiro contato e qualificação de leads';
      case 'sales': return 'Focado em conversão e fechamento de vendas';
      case 'support': return 'Suporte técnico e atendimento ao cliente';
      case 'custom': return 'Configuração personalizada para suas necessidades';
      default: return '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome do Agente */}
        <div className="md:col-span-2">
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
              className="pl-10 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
              required
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">Escolha um nome descritivo para seu agente</p>
        </div>

        {/* Tipo do Agente */}
        <div className="md:col-span-2">
          <Label htmlFor="type" className="text-base font-semibold text-gray-700 mb-3 block">
            Tipo do Agente *
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {['attendance', 'sales', 'support', 'custom'].map((type) => (
              <Card 
                key={type}
                className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-md ${
                  formData.type === type 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData({ ...formData, type: type as any })}
              >
                <CardContent className="p-4 text-center">
                  <div className={`mx-auto mb-2 p-2 rounded-lg w-fit ${
                    formData.type === type ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getTypeIcon(type)}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{getTypeLabel(type)}</h3>
                  <p className="text-xs text-gray-500">{getTypeDescription(type)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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
              <SelectTrigger className="pl-10 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                <SelectValue placeholder="Selecione um funil" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200">
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
              <SelectTrigger className="pl-10 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                <SelectValue placeholder="Selecione uma instância" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200">
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
          className="px-8 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isLoading ? "Salvando..." : agent ? "Atualizar Agente" : "Criar Agente"}
        </Button>
      </div>
    </form>
  );
};
