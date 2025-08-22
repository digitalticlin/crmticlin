
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIAgent, CreateAIAgentData } from '@/types/aiAgent';
import { Funnel } from '@/types/funnel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bot, Zap, MessageCircle, Headphones, Wand2 } from 'lucide-react';

interface AIAgentFormProps {
  agent?: AIAgent;
  onSave: (savedAgent: AIAgent) => void;
  onCancel: () => void;
  onFormChange: (hasChanges: boolean) => void;
}

interface WhatsAppInstance {
  id: string;
  instance_name: string;
}

export const AIAgentForm = ({ agent, onSave, onCancel, onFormChange }: AIAgentFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateAIAgentData>({
    name: agent?.name || '',
    type: agent?.type || 'attendance',
    funnel_id: agent?.funnel_id || null,
    whatsapp_number_id: agent?.whatsapp_number_id || null,
  });
  
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [whatsappInstances, setWhatsappInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const agentTypes = [
    { 
      value: 'attendance', 
      label: 'Atendimento', 
      icon: MessageCircle,
      description: 'Atendimento geral e suporte ao cliente'
    },
    { 
      value: 'sales', 
      label: 'Vendas', 
      icon: Zap,
      description: 'Focado em conversão e vendas'
    },
    { 
      value: 'support', 
      label: 'Suporte', 
      icon: Headphones,
      description: 'Suporte técnico especializado'
    },
    { 
      value: 'custom', 
      label: 'Personalizado', 
      icon: Wand2,
      description: 'Agente com configuração personalizada'
    }
  ];

  useEffect(() => {
    fetchFunnels();
    fetchWhatsAppInstances();
  }, [user]);

  useEffect(() => {
    const initialData = {
      name: agent?.name || '',
      type: agent?.type || 'attendance',
      funnel_id: agent?.funnel_id || null,
      whatsapp_number_id: agent?.whatsapp_number_id || null,
    };
    
    const currentHasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
    if (currentHasChanges !== hasChanges) {
      setHasChanges(currentHasChanges);
      onFormChange(currentHasChanges);
    }
  }, [formData, agent, hasChanges, onFormChange]);

  const fetchFunnels = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('funnels')
        .select('id, name, created_by_user_id')
        .eq('created_by_user_id', user.id);

      if (error) throw error;
      
      setFunnels(data.map(item => ({
        id: item.id,
        name: item.name,
        created_by_user_id: item.created_by_user_id
      })));
    } catch (error) {
      console.error('Erro ao buscar funis:', error);
    }
  };

  const fetchWhatsAppInstances = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name')
        .eq('created_by_user_id', user.id);

      if (error) throw error;
      
      setWhatsappInstances(data || []);
    } catch (error) {
      console.error('Erro ao buscar instâncias WhatsApp:', error);
    }
  };

  const handleInputChange = (field: keyof CreateAIAgentData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Nome do agente é obrigatório');
      return;
    }

    setIsLoading(true);
    
    try {
      if (agent) {
        // Atualizar agente existente
        const { data, error } = await supabase
          .from('ai_agents')
          .update({
            name: formData.name,
            type: formData.type,
            funnel_id: formData.funnel_id,
            whatsapp_number_id: formData.whatsapp_number_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', agent.id)
          .select()
          .single();

        if (error) throw error;
        
        // Cast the returned data to AIAgent type
        const savedAgent: AIAgent = {
          ...data,
          type: data.type as 'attendance' | 'sales' | 'support' | 'custom',
          status: data.status as 'active' | 'inactive'
        };
        
        onSave(savedAgent);
      } else {
        // Criar novo agente
        const { data, error } = await supabase
          .from('ai_agents')
          .insert({
            ...formData,
            created_by_user_id: user.id,
            status: 'active',
            messages_count: 0
          })
          .select()
          .single();

        if (error) throw error;
        
        // Cast the returned data to AIAgent type
        const savedAgent: AIAgent = {
          ...data,
          type: data.type as 'attendance' | 'sales' | 'support' | 'custom',
          status: data.status as 'active' | 'inactive'
        };
        
        onSave(savedAgent);
      }
      
      toast.success(agent ? 'Agente atualizado com sucesso!' : 'Agente criado com sucesso!');
      
    } catch (error: any) {
      console.error('Erro ao salvar agente:', error);
      toast.error('Erro ao salvar agente: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAgentType = agentTypes.find(type => type.value === formData.type);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-white/50 backdrop-blur-sm border border-white/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Agente</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Assistente de Vendas"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo do Agente</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {agentTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedAgentType && (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <selectedAgentType.icon className="w-4 h-4" />
                  <span className="font-medium">{selectedAgentType.label}</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">{selectedAgentType.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/50 backdrop-blur-sm border border-white/30">
        <CardHeader>
          <CardTitle>Integrações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="funnel">Funil de Vendas</Label>
            <Select 
              value={formData.funnel_id || ''} 
              onValueChange={(value) => handleInputChange('funnel_id', value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um funil (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum funil</SelectItem>
                {funnels.map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    {funnel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">Número WhatsApp</Label>
            <Select 
              value={formData.whatsapp_number_id || ''} 
              onValueChange={(value) => handleInputChange('whatsapp_number_id', value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma instância (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma instância</SelectItem>
                {whatsappInstances.map((instance) => (
                  <SelectItem key={instance.id} value={instance.id}>
                    {instance.instance_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !hasChanges}>
          {isLoading ? 'Salvando...' : (agent ? 'Atualizar Agente' : 'Criar Agente')}
        </Button>
      </div>
    </form>
  );
};
