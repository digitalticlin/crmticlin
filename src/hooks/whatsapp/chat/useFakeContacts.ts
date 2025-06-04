
import { useCallback } from 'react';
import { Contact } from '@/types/chat';
import { unifiedLeads, convertLeadToContact } from '@/data/unifiedFakeData';

/**
 * Hook para gerenciar contatos fake para demonstração
 * Agora sincronizado com os dados do funil de vendas
 */
export const useFakeContacts = () => {
  const getFakeContacts = useCallback((): Contact[] => {
    // Converter todos os leads unificados para contatos
    return unifiedLeads.map(lead => convertLeadToContact(lead));
  }, []);

  return { getFakeContacts };
};
