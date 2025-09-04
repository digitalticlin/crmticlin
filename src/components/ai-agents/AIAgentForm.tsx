
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { unstable_batchedUpdates } from "react-dom";
import { AIAgent, CreateAIAgentData } from "@/types/aiAgent";
import { useAIAgents } from "@/hooks/useAIAgents";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Link, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface AIAgentFormProps {
  agent?: AIAgent | null;
  onSave: (agent: AIAgent) => void;
  onCancel: () => void;
  onFormChange?: (hasChanges: boolean) => void;
}

export const AIAgentForm = ({ agent, onSave, onCancel, onFormChange }: AIAgentFormProps) => {
  const { createAgent, updateAgent } = useAIAgents();
  const [isLoading, setIsLoading] = useState(false);
  const [funnels, setFunnels] = useState<any[]>([]);
  const [whatsappInstances, setWhatsappInstances] = useState<any[]>([]);
  const [existingAgents, setExistingAgents] = useState<AIAgent[]>([]);
  
  const [formData, setFormData] = useState<CreateAIAgentData>({
    name: agent?.name || "",
    type: agent?.type || "sales",
    funnel_id: agent?.funnel_id || null,
    whatsapp_number_id: agent?.whatsapp_number_id || null,
  });

  // Sincronizar formData quando agent prop mudar
  useEffect(() => {
    console.log('🔄 Sincronizando formData com agent prop:', agent);
    setFormData({
      name: agent?.name || "",
      type: agent?.type || "sales",
      funnel_id: agent?.funnel_id || null,
      whatsapp_number_id: agent?.whatsapp_number_id || null,
    });
  }, [agent]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [funnelsRes, instancesRes, agentsRes] = await Promise.all([
          supabase.from('funnels').select('id, name'),
          supabase.from('whatsapp_instances').select('id, instance_name, profile_name'),
          supabase.from('ai_agents').select('id, name, type, status, funnel_id, whatsapp_number_id, messages_count, created_by_user_id, created_at, updated_at')
        ]);

        if (funnelsRes.data) setFunnels(funnelsRes.data);
        if (instancesRes.data) setWhatsappInstances(instancesRes.data);
        if (agentsRes.data) setExistingAgents(agentsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);


  // Filtrar funis disponíveis (excluir os já em uso por outros agentes)
  const getAvailableFunnels = () => {
    const usedFunnelIds = existingAgents
      .filter(a => a.id !== agent?.id && a.funnel_id) // Excluir o agente atual (se editando)
      .map(a => a.funnel_id);
    
    return funnels.filter(funnel => !usedFunnelIds.includes(funnel.id));
  };

  // Filtrar instâncias WhatsApp disponíveis (excluir as já em uso por outros agentes)
  const getAvailableWhatsAppInstances = () => {
    const usedInstanceIds = existingAgents
      .filter(a => a.id !== agent?.id && a.whatsapp_number_id) // Excluir o agente atual (se editando)
      .map(a => a.whatsapp_number_id);
    
    return whatsappInstances.filter(instance => !usedInstanceIds.includes(instance.id));
  };

  // Função para detectar se há mudanças comparando com dados originais
  const hasFormChanges = (currentData: CreateAIAgentData): boolean => {
    if (!agent) return false; // Para novos agentes, não há dados originais para comparar
    
    return (
      currentData.name !== agent.name ||
      currentData.type !== agent.type ||
      currentData.funnel_id !== agent.funnel_id ||
      currentData.whatsapp_number_id !== agent.whatsapp_number_id
    );
  };

  const handleFieldChange = (field: keyof CreateAIAgentData, value: any) => {
    console.log(`🔄 Campo alterado: ${field} = ${value}`);
    
    // Atualizar estado local
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Notificar modal principal sobre mudanças
    if (onFormChange) {
      const hasChanges = hasFormChanges(newFormData);
      console.log(`📊 Mudanças detectadas na Aba 1: ${hasChanges}`);
      onFormChange(hasChanges);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório', {
        description: 'Por favor, digite um nome para o agente',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (agent) {
        console.log('🔄 Atualizando agente existente:', agent.id, formData);
        const success = await updateAgent(agent.id, formData);
        if (success) {
          const updatedAgent = { ...agent, ...formData };
          console.log('✅ Agente atualizado com sucesso');
          
          // Resetar estado de mudanças após salvamento bem-sucedido
          if (onFormChange) {
            onFormChange(false);
          }
          
          onSave(updatedAgent);
          toast.success('Agente salvo com sucesso');
        }
      } else {
        console.log('➕ Criando novo agente:', formData);
        const newAgent = await createAgent(formData);
        if (newAgent) {
          console.log('✅ Novo agente criado com sucesso:', newAgent.id);
          
          // Para novos agentes, não resetar estado pois não há mudanças para detectar
          onSave(newAgent);
          toast.success('Agente criado com sucesso');
        }
      }
    } catch (error) {
      console.error('❌ Erro no handleSubmit:', error);
      toast.error('Erro ao salvar agente', {
        description: 'Verifique os dados e tente novamente',
      });
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
                  onChange={(e) => handleFieldChange('name', e.target.value)}
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
                <div className="relative">
                  <select
                    id="funnel-select"
                    value={formData.funnel_id || ''}
                    onChange={(e) => handleFieldChange('funnel_id', e.target.value === '' ? null : e.target.value)}
                    disabled={isLoading}
                    className={`h-12 w-full bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-xl px-3 py-2 text-sm text-gray-800 appearance-none cursor-pointer transition-all duration-200 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="" className="bg-white text-gray-800">🔄 Nenhum funil selecionado</option>
                    {getAvailableFunnels().map((funnel) => (
                      <option key={funnel.id} value={funnel.id} className="bg-white text-gray-800">
                        🎯 {funnel.name}
                      </option>
                    ))}
                    {/* Mostrar funil atual se estiver editando, mesmo que esteja "em uso" */}
                    {agent && agent.funnel_id && !getAvailableFunnels().find(f => f.id === agent.funnel_id) && (
                      <option key={agent.funnel_id} value={agent.funnel_id} className="bg-white text-gray-800">
                        🎯 {funnels.find(f => f.id === agent.funnel_id)?.name} (atual)
                      </option>
                    )}
                  </select>
                  {/* Loading indicator or arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </div>
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
                <div className="relative">
                  <select
                    id="whatsapp-select"
                    value={formData.whatsapp_number_id || ''}
                    onChange={(e) => handleFieldChange('whatsapp_number_id', e.target.value === '' ? null : e.target.value)}
                    disabled={isLoading}
                    className={`h-12 w-full bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-xl px-3 py-2 text-sm text-gray-800 appearance-none cursor-pointer transition-all duration-200 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="" className="bg-white text-gray-800">📱 Nenhuma instância selecionada</option>
                    {getAvailableWhatsAppInstances().map((instance) => (
                      <option key={instance.id} value={instance.id} className="bg-white text-gray-800">
                        💬 {instance.profile_name || instance.instance_name}
                      </option>
                    ))}
                    {/* Mostrar instância atual se estiver editando, mesmo que esteja "em uso" */}
                    {agent && agent.whatsapp_number_id && !getAvailableWhatsAppInstances().find(i => i.id === agent.whatsapp_number_id) && (
                      <option key={agent.whatsapp_number_id} value={agent.whatsapp_number_id} className="bg-white text-gray-800">
                        💬 {whatsappInstances.find(i => i.id === agent.whatsapp_number_id)?.profile_name || 
                             whatsappInstances.find(i => i.id === agent.whatsapp_number_id)?.instance_name} (atual)
                      </option>
                    )}
                  </select>
                  {/* Loading indicator or arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </div>
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
