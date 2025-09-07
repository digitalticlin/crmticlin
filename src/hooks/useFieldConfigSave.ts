
import { useState } from 'react';
import { useAIAgentPrompts } from './useAIAgentPrompts';
import { toast } from 'sonner';
import { AIAgentPrompt } from '@/types/aiAgent';

export const useFieldConfigSave = (agentId: string) => {
  const [isSaving, setIsSaving] = useState(false);
  const { updateAIAgentPrompt: updatePrompt } = useAIAgentPrompts();

  const saveFieldConfig = async (fieldKey: keyof AIAgentPrompt, value: any): Promise<boolean> => {
    if (!agentId) {
      console.error('❌ [useFieldConfigSave] Agent ID não fornecido');
      toast.error('Erro interno: ID do agente não encontrado');
      return false;
    }

    setIsSaving(true);
    
    try {
      console.log('\n=== 💾 [useFieldConfigSave] SALVANDO CONFIGURAÇÃO ===');
      console.log('🆔 Agent ID:', agentId);
      console.log('🔑 Campo:', fieldKey);
      console.log('📊 Valor:', value);
      console.log('📄 Tipo do valor:', typeof value);
      
      // Preparar update object com apenas o campo específico
      const updateData: Partial<AIAgentPrompt> = {
        [fieldKey]: value
      };
      
      console.log('📝 [useFieldConfigSave] Dados para update:', updateData);
      
      // Executar update 
      await updatePrompt({ agent_id: agentId, [fieldKey]: value });
      
      console.log('✅ [useFieldConfigSave] Configuração salva com sucesso');
      
      // Mostrar feedback visual por 1.5 segundos
      toast.success('Configuração salva!', {
        duration: 1500,
        description: 'As alterações foram aplicadas ao agente'
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ [useFieldConfigSave] Erro ao salvar configuração:', error);
      
      toast.error('Erro ao salvar', {
        description: 'Não foi possível salvar as alterações. Tente novamente.'
      });
      
      return false;
      
    } finally {
      setIsSaving(false);
      console.log('=== FIM SALVAMENTO ===\n');
    }
  };

  // Função específica para salvar arrays JSONB (como rules_guidelines, prohibitions, etc.)
  const saveArrayField = async (fieldKey: keyof AIAgentPrompt, items: string[]): Promise<boolean> => {
    console.log('📋 [useFieldConfigSave] Salvando array field:', fieldKey, 'com', items.length, 'itens');
    return await saveFieldConfig(fieldKey, items);
  };

  // Função específica para salvar strings
  const saveStringField = async (fieldKey: keyof AIAgentPrompt, text: string): Promise<boolean> => {
    console.log('📝 [useFieldConfigSave] Salvando string field:', fieldKey, 'com', text.length, 'caracteres');
    return await saveFieldConfig(fieldKey, text);
  };

  return {
    isSaving,
    saveFieldConfig,
    saveArrayField,
    saveStringField
  };
};
