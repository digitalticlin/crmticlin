
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '@/hooks/useCompanyData';
import { extractUsernameFromEmail, generateSequentialInstanceName } from '@/utils/instanceNaming';

export const useIntelligentNaming = () => {
  const { companyId } = useCompanyData();

  // FASE 3.1.3: Função para gerar nome inteligente de instância
  const generateIntelligentInstanceName = useCallback(async (userEmail: string): Promise<string> => {
    try {
      console.log('[Intelligent Naming] 🎯 FASE 3.1.3: Gerando nome inteligente para:', userEmail);
      
      if (!userEmail) {
        console.log('[Intelligent Naming] ⚠️ Email não disponível, usando fallback');
        return `whatsapp_${Date.now()}`;
      }

      // Extrair username do email (digitalticlin@gmail.com → digitalticlin)
      const username = extractUsernameFromEmail(userEmail);
      console.log('[Intelligent Naming] 📧 Username extraído:', username);

      // Buscar nomes de instâncias existentes (sem filtro por company_id por enquanto)
      const { data: existingInstances, error } = await supabase
        .from('whatsapp_instances')
        .select('instance_name');

      if (error) {
        console.error('[Intelligent Naming] ❌ Erro ao buscar instâncias existentes:', error);
        return `${username}_${Date.now()}`;
      }

      const existingNames = existingInstances?.map(i => i.instance_name) || [];
      console.log('[Intelligent Naming] 📋 Nomes existentes:', existingNames);

      // Gerar nome sequencial (digitalticlin, digitalticlin1, digitalticlin2...)
      const intelligentName = generateSequentialInstanceName(username, existingNames);
      console.log('[Intelligent Naming] ✅ Nome inteligente gerado:', intelligentName);

      return intelligentName;

    } catch (error) {
      console.error('[Intelligent Naming] ❌ Erro na geração de nome inteligente:', error);
      // Fallback para timestamp se algo der errado
      return `whatsapp_${Date.now()}`;
    }
  }, [companyId]);

  return {
    generateIntelligentInstanceName
  };
};
