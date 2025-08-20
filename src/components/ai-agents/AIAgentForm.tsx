
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
}

export const AIAgentForm = ({ agent, onSave, onCancel }: AIAgentFormProps) => {
  const { createAgent, updateAgent } = useAIAgents();
  const [isLoading, setIsLoading] = useState(false);
  const [funnels, setFunnels] = useState<any[]>([]);
  const [whatsappInstances, setWhatsappInstances] = useState<any[]>([]);
  const [nameDebounceTimer, setNameDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
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

  // Limpar timer quando componente for desmontado
  useEffect(() => {
    return () => {
      if (nameDebounceTimer) {
        clearTimeout(nameDebounceTimer);
      }
    };
  }, [nameDebounceTimer]);

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


  const handleFieldChange = async (field: keyof CreateAIAgentData, value: any) => {
    console.log(`🔄 Campo alterado: ${field} = ${value}`);
    
    // Criar os novos dados com o valor atualizado
    const newFormData = { ...formData, [field]: value };
    
    // Atualizar estado local primeiro
    unstable_batchedUpdates(() => {
      setFormData(newFormData);
    });
    
    // Auto-salvar se for um agente existente
    if (agent) {
      // Para o campo nome, usar debounce
      if (field === 'name') {
        // Limpar timer anterior se existir
        if (nameDebounceTimer) {
          clearTimeout(nameDebounceTimer);
        }
        
        // Criar novo timer
        const timer = setTimeout(async () => {
          console.log(`💾 Auto-salvando nome (debounced) para agente ${agent.id}`);
          await performSave(field, value, newFormData);
        }, 1000); // 1 segundo de debounce
        
        setNameDebounceTimer(timer);
      } else {
        // Para outros campos, salvar imediatamente
        await performSave(field, value, newFormData);
      }
    }
  };

  const performSave = async (field: keyof CreateAIAgentData, value: any, newFormData: CreateAIAgentData) => {
    if (!agent) return;
    
    console.log(`💾 Executando salvamento para ${field} = ${value}`);
    
    try {
      setIsLoading(true);
      const success = await updateAgent(agent.id, newFormData);
      
      if (success) {
        const updatedAgent = { ...agent, ...newFormData };
        console.log('✅ Auto-salvamento realizado com sucesso');
        
        // Feedback visual discreto baseado no campo
        let message = '';
        
        if (field === 'name') {
          message = `Nome alterado para "${value}"`;
        } else if (field === 'funnel_id') {
          if (value === null || value === '') {
            message = 'Funil removido';
          } else {
            const fieldValue = funnels.find(f => f.id === value)?.name;
            message = `Funil alterado para "${fieldValue}"`;
          }
        } else if (field === 'whatsapp_number_id') {
          if (value === null || value === '') {
            message = 'Instância WhatsApp removida';
          } else {
            const fieldValue = whatsappInstances.find(i => i.id === value)?.profile_name || whatsappInstances.find(i => i.id === value)?.instance_name;
            message = `Instância WhatsApp alterada para "${fieldValue}"`;
          }
        }
        
        if (message) {
          toast.success(message, {
            description: '💾 Salvo automaticamente',
            duration: 2000,
          });
        }
        
        onSave(updatedAgent);
      } else {
        console.error('❌ Erro no auto-salvamento');
        toast.error('Erro ao salvar alteração', {
          description: 'Tente novamente ou use o botão Salvar',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Erro crítico no auto-salvamento:', error);
      toast.error('Erro ao salvar', {
        description: 'Verifique sua conexão e tente novamente',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
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
          onSave(updatedAgent);
          toast.success('Agente salvo com sucesso');
        }
      } else {
        console.log('➕ Criando novo agente:', formData);
        const newAgent = await createAgent(formData);
        if (newAgent) {
          console.log('✅ Novo agente criado com sucesso:', newAgent.id);
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
                    {funnels.map((funnel) => (
                      <option key={funnel.id} value={funnel.id} className="bg-white text-gray-800">
                        🎯 {funnel.name}
                      </option>
                    ))}
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
                    {whatsappInstances.map((instance) => (
                      <option key={instance.id} value={instance.id} className="bg-white text-gray-800">
                        💬 {instance.profile_name || instance.instance_name}
                      </option>
                    ))}
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
