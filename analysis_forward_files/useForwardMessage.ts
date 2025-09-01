
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ForwardService } from '@/services/whatsapp/forwardService';
import { Message, Contact } from '@/types/chat';
import { ForwardState, ForwardProgress } from '@/types/whatsapp/forward';

interface UseForwardMessageProps {
  activeInstanceId?: string;
}

export const useForwardMessage = ({ activeInstanceId }: UseForwardMessageProps) => {
  const [forwardState, setForwardState] = useState<ForwardState>({
    isModalOpen: false,
    selectedMessage: null,
    selectedContacts: [],
    additionalComment: '',
    isForwarding: false,
    forwardProgress: {
      current: 0,
      total: 0,
      isCompleted: false,
      results: []
    }
  });

  const openForwardModal = useCallback((message: Message) => {
    console.log('[useForwardMessage] Abrindo modal de encaminhamento:', message.id);
    
    if (!ForwardService.validateForwardable(message)) {
      toast.error('Esta mensagem não pode ser encaminhada');
      return;
    }

    setForwardState(prev => ({
      ...prev,
      isModalOpen: true,
      selectedMessage: message,
      selectedContacts: [],
      additionalComment: '',
      forwardProgress: {
        current: 0,
        total: 0,
        isCompleted: false,
        results: []
      }
    }));
  }, []);

  const closeForwardModal = useCallback(() => {
    console.log('[useForwardMessage] Fechando modal de encaminhamento');
    setForwardState(prev => ({
      ...prev,
      isModalOpen: false,
      selectedMessage: null,
      selectedContacts: [],
      additionalComment: '',
      isForwarding: false,
      forwardProgress: {
        current: 0,
        total: 0,
        isCompleted: false,
        results: []
      }
    }));
  }, []);

  const setSelectedContacts = useCallback((contacts: Contact[]) => {
    setForwardState(prev => ({
      ...prev,
      selectedContacts: contacts
    }));
  }, []);

  const setAdditionalComment = useCallback((comment: string) => {
    setForwardState(prev => ({
      ...prev,
      additionalComment: comment
    }));
  }, []);

  const executeForward = useCallback(async () => {
    const { selectedMessage, selectedContacts, additionalComment } = forwardState;

    if (!selectedMessage || selectedContacts.length === 0 || !activeInstanceId) {
      toast.error('Selecione pelo menos um contato para encaminhar');
      return;
    }

    console.log('[useForwardMessage] Executando encaminhamento:', {
      messageId: selectedMessage.id,
      contactsCount: selectedContacts.length,
      instanceId: activeInstanceId
    });

    setForwardState(prev => ({
      ...prev,
      isForwarding: true,
      forwardProgress: {
        current: 0,
        total: selectedContacts.length,
        isCompleted: false,
        results: []
      }
    }));

    try {
      // Simular progresso para cada contato
      const results = [];
      
      for (let i = 0; i < selectedContacts.length; i++) {
        const contact = selectedContacts[i];
        
        // Atualizar progresso
        setForwardState(prev => ({
          ...prev,
          forwardProgress: {
            ...prev.forwardProgress,
            current: i + 1
          }
        }));

        const result = await ForwardService.forwardToContact(
          selectedMessage,
          contact,
          activeInstanceId,
          additionalComment
        );
        
        results.push(result);
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      // Finalizar progresso
      setForwardState(prev => ({
        ...prev,
        isForwarding: false,
        forwardProgress: {
          ...prev.forwardProgress,
          isCompleted: true,
          results
        }
      }));

      // Mostrar resultado
      if (successCount === selectedContacts.length) {
        toast.success(`Mensagem encaminhada para ${successCount} contatos`);
      } else if (successCount > 0) {
        toast.warning(`Mensagem encaminhada para ${successCount} de ${selectedContacts.length} contatos`);
      } else {
        toast.error('Não foi possível encaminhar a mensagem');
      }

      // Fechar modal após sucesso
      if (successCount > 0) {
        setTimeout(() => {
          closeForwardModal();
        }, 2000);
      }

    } catch (error: any) {
      console.error('[useForwardMessage] Erro no encaminhamento:', error);
      
      setForwardState(prev => ({
        ...prev,
        isForwarding: false
      }));
      
      toast.error(`Erro ao encaminhar: ${error.message}`);
    }
  }, [forwardState, activeInstanceId, closeForwardModal]);

  return {
    forwardState,
    openForwardModal,
    closeForwardModal,
    setSelectedContacts,
    setAdditionalComment,
    executeForward,
    isForwardingAvailable: !!activeInstanceId
  };
};
