
import { useState, useCallback } from 'react';
import { Message } from '@/types/chat';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { WhatsAppWebInstance } from '../useWhatsAppWebInstances';
import { Contact } from '@/types/chat';
import { toast } from "sonner";

/**
 * Hook para gerenciar mensagens do chat WhatsApp Web
 */
export const useWhatsAppChatMessages = (
  selectedContact: Contact | null,
  activeInstance: WhatsAppWebInstance | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Gerar mensagens fake baseadas no contato
  const generateFakeMessages = useCallback((contact: Contact): Message[] => {
    const baseTime = new Date();
    
    // Diferentes conversas baseadas no nome do contato
    if (contact.name === "João Silva") {
      return [
        {
          id: "msg1",
          text: "Olá! Vi seu anúncio e gostaria de saber mais sobre o serviço",
          sender: "contact",
          time: new Date(baseTime.getTime() - 3600000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: "read",
          isIncoming: true,
          fromMe: false
        },
        {
          id: "msg2", 
          text: "Olá João! Fico feliz pelo seu interesse. Temos várias opções de planos. Qual seria seu orçamento aproximado?",
          sender: "user",
          time: new Date(baseTime.getTime() - 3500000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: "read",
          isIncoming: false,
          fromMe: true
        },
        {
          id: "msg3",
          text: "Estou pensando em algo entre R$ 2.000 e R$ 3.000. É para uma empresa de médio porte",
          sender: "contact",
          time: new Date(baseTime.getTime() - 3000000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: "read",
          isIncoming: true,
          fromMe: false
        },
        {
          id: "msg4",
          text: "Perfeito! Temos um plano corporativo que se encaixa no seu orçamento. Inclui 5000 mensagens/mês, dashboard completo e suporte prioritário. Posso enviar uma proposta?",
          sender: "user",
          time: new Date(baseTime.getTime() - 2500000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: "read",
          isIncoming: false,
          fromMe: true
        },
        {
          id: "msg5",
          text: "Sim, por favor! E tem desconto à vista?",
          sender: "contact",
          time: new Date(baseTime.getTime() - 1800000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: "read",
          isIncoming: true,
          fromMe: false
        },
        {
          id: "msg6",
          text: "Claro! À vista temos 15% de desconto. O valor ficaria R$ 2.125. Vou preparar a proposta completa agora 📄",
          sender: "user",
          time: new Date(baseTime.getTime() - 1200000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: "read",
          isIncoming: false,
          fromMe: true
        },
        {
          id: "msg7",
          text: contact.lastMessage || "Perfeito! Aguardo a proposta então 😊",
          sender: "contact",
          time: contact.lastMessageTime || "10:30",
          status: "delivered",
          isIncoming: true,
          fromMe: false
        }
      ];
    }

    if (contact.name === "Maria Oliveira") {
      return [
        {
          id: "msg1",
          text: "Bom dia! Preciso de um sistema para minha loja online",
          sender: "contact",
          time: "08:15",
          status: "read",
          isIncoming: true,
          fromMe: false
        },
        {
          id: "msg2",
          text: "Bom dia Maria! Que ótimo! Qual o tipo de produtos você vende?",
          sender: "user",
          time: "08:18",
          status: "read",
          isIncoming: false,
          fromMe: true
        },
        {
          id: "msg3",
          text: "Vendo roupas femininas. Tenho cerca de 500 produtos no catálogo",
          sender: "contact",
          time: "08:20",
          status: "read",
          isIncoming: true,
          fromMe: false
        },
        {
          id: "msg4",
          text: "Perfeito! Nosso plano básico atende perfeitamente. Por R$ 799/mês você tem catálogo ilimitado, carrinho de compras e integração com pagamentos",
          sender: "user",
          time: "08:25",
          status: "read",
          isIncoming: false,
          fromMe: true
        },
        {
          id: "msg5",
          text: contact.lastMessage || "Qual o preço do plano básico?",
          sender: "contact",
          time: contact.lastMessageTime || "09:15",
          status: "delivered",
          isIncoming: true,
          fromMe: false
        }
      ];
    }

    if (contact.name === "Ana Silva") {
      return [
        {
          id: "msg1",
          text: "Olá! Represento uma agência de marketing e precisamos de uma solução robusta",
          sender: "contact",
          time: "13:45",
          status: "read",
          isIncoming: true,
          fromMe: false
        },
        {
          id: "msg2",
          text: "Olá Ana! Que legal! Quantos clientes vocês atendem aproximadamente?",
          sender: "user",
          time: "13:48",
          status: "read",
          isIncoming: false,
          fromMe: true
        },
        {
          id: "msg3",
          text: "Atendemos cerca de 50 clientes atualmente. Precisamos de multi-usuários, relatórios avançados e white label",
          sender: "contact",
          time: "13:52",
          status: "read",
          isIncoming: true,
          fromMe: false
        },
        {
          id: "msg4",
          text: "Perfeito! Temos o plano Enterprise ideal para agências. Inclui tudo que vocês precisam por R$ 4.999/mês",
          sender: "user",
          time: "14:00",
          status: "read",
          isIncoming: false,
          fromMe: true
        },
        {
          id: "msg5",
          text: contact.lastMessage || "Gostaria de saber mais sobre os planos premium 💼",
          sender: "contact",
          time: contact.lastMessageTime || "14:30",
          status: "delivered",
          isIncoming: true,
          fromMe: false
        }
      ];
    }

    if (contact.name === "Carlos Oliveira") {
      return [
        {
          id: "msg1",
          text: "Oi! Vocês fazem integração com sistemas existentes?",
          sender: "contact",
          time: "12:30",
          status: "read",
          isIncoming: true,
          fromMe: false
        },
        {
          id: "msg2",
          text: "Oi Carlos! Sim, fazemos integração via API com diversos sistemas. Qual sistema vocês usam atualmente?",
          sender: "user",
          time: "12:35",
          status: "read",
          isIncoming: false,
          fromMe: true
        },
        {
          id: "msg3",
          text: "Usamos Salesforce e queremos integrar o WhatsApp Business",
          sender: "contact",
          time: "12:40",
          status: "read",
          isIncoming: true,
          fromMe: false
        },
        {
          id: "msg4",
          text: "Excelente escolha! Temos integração nativa com Salesforce. Posso agendar uma demo para mostrar como funciona?",
          sender: "user",
          time: "12:45",
          status: "read",
          isIncoming: false,
          fromMe: true
        },
        {
          id: "msg5",
          text: contact.lastMessage || "Perfeito! Quando podemos agendar? 📅",
          sender: "contact",
          time: contact.lastMessageTime || "13:45",
          status: "delivered",
          isIncoming: true,
          fromMe: false
        }
      ];
    }

    if (contact.name === "Pedro Santos") {
      return [
        {
          id: "msg1",
          text: "Recebi sua proposta por email. Está muito boa!",
          sender: "contact",
          time: "16:20",
          status: "read",
          isIncoming: true,
          fromMe: false
        },
        {
          id: "msg2",
          text: "Que bom que gostou Pedro! Tem alguma dúvida sobre os termos?",
          sender: "user",
          time: "16:25",
          status: "read",
          isIncoming: false,
          fromMe: true
        },
        {
          id: "msg3",
          text: "Só sobre o prazo de implementação. Quanto tempo leva?",
          sender: "contact",
          time: "16:30",
          status: "read",
          isIncoming: true,
          fromMe: false
        },
        {
          id: "msg4",
          text: "A implementação leva de 5 a 7 dias úteis após a assinatura do contrato. Incluindo treinamento da equipe!",
          sender: "user",
          time: "16:35",
          status: "read",
          isIncoming: false,
          fromMe: true
        },
        {
          id: "msg5",
          text: contact.lastMessage || "Vou analisar a proposta, obrigado! 🤝",
          sender: "contact",
          time: contact.lastMessageTime || "Ontem",
          status: "delivered",
          isIncoming: true,
          fromMe: false
        }
      ];
    }

    // Mensagens padrão para outros contatos
    return [
      {
        id: "msg1",
        text: "Olá! Como posso ajudar você?",
        sender: "user",
        time: "10:00",
        status: "read",
        isIncoming: false,
        fromMe: true
      },
      {
        id: "msg2",
        text: contact.lastMessage || "Olá! Gostaria de mais informações",
        sender: "contact",
        time: contact.lastMessageTime || "10:05",
        status: "delivered",
        isIncoming: true,
        fromMe: false
      }
    ];
  }, []);

  // Buscar mensagens do contato selecionado
  const fetchMessages = useCallback(async () => {
    if (!selectedContact) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      console.log('[WhatsApp Web Chat] 💬 Fetching messages for contact:', selectedContact.id);

      // Se tem instância ativa, tentar buscar do banco primeiro
      if (activeInstance) {
        const { data: dbMessages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('lead_id', selectedContact.id)
          .eq('whatsapp_number_id', activeInstance.id)
          .order('timestamp', { ascending: true });

        if (!error && dbMessages && dbMessages.length > 0) {
          const mappedMessages: Message[] = dbMessages.map(msg => ({
            id: msg.id,
            text: msg.text || '',
            sender: msg.from_me ? 'user' : 'contact',
            time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            status: msg.status === 'sent' ? 'sent' : msg.status === 'delivered' ? 'delivered' : 'read',
            isIncoming: !msg.from_me,
            fromMe: msg.from_me
          }));

          console.log('[WhatsApp Web Chat] ✅ Real messages fetched:', mappedMessages.length);
          setMessages(mappedMessages);
          return;
        }
      }

      // Se não há mensagens reais, usar mensagens fake
      const fakeMessages = generateFakeMessages(selectedContact);
      console.log('[WhatsApp Web Chat] ✅ Fake messages generated:', fakeMessages.length);
      setMessages(fakeMessages);
    } catch (error) {
      console.error('[WhatsApp Web Chat] ❌ Error fetching messages:', error);
      // Em caso de erro, usar mensagens fake
      const fakeMessages = generateFakeMessages(selectedContact);
      setMessages(fakeMessages);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedContact, activeInstance, generateFakeMessages]);

  // Enviar mensagem via WhatsApp Web.js - VERSÃO OTIMIZADA
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!selectedContact || !text.trim()) {
      console.warn('[WhatsApp Web Chat] Cannot send message: missing data');
      toast.error('Dados insuficientes para envio');
      return false;
    }

    setIsSending(true);
    
    // MENSAGEM OTIMISTA - Mostrar imediatamente
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      time: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      status: 'sent',
      isIncoming: false,
      fromMe: true
    };

    // Adicionar mensagem otimista à lista
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      if (activeInstance) {
        console.log('[WhatsApp Web Chat] 📤 Sending message:', {
          instanceId: activeInstance.id,
          phone: selectedContact.phone,
          text: text.trim()
        });

        const result = await WhatsAppWebService.sendMessage(
          activeInstance.id,
          selectedContact.phone,
          text.trim()
        );

        if (result.success) {
          console.log('[WhatsApp Web Chat] ✅ Message sent successfully');
          
          // Remover mensagem otimista
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
          
          // Atualizar dados após envio (com delay para dar tempo do webhook processar)
          setTimeout(async () => {
            await fetchMessages();
          }, 1000);

          toast.success('Mensagem enviada');
          return true;
        } else {
          console.error('[WhatsApp Web Chat] ❌ Failed to send message:', result.error);
          
          // Remover mensagem otimista em caso de erro
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
          
          toast.error(`Erro ao enviar: ${result.error}`);
          return false;
        }
      } else {
        // Modo demo - simular envio bem-sucedido
        console.log('[WhatsApp Web Chat] 📤 Demo mode - simulating message send');
        
        // Substituir mensagem otimista por uma com status 'delivered'
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...msg, status: 'delivered' as const }
            : msg
        ));

        toast.success('Mensagem enviada (modo demonstração)');
        return true;
      }
    } catch (error) {
      console.error('[WhatsApp Web Chat] ❌ Error sending message:', error);
      
      // Remover mensagem otimista em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      toast.error('Erro inesperado ao enviar mensagem');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, activeInstance, fetchMessages]);

  return {
    messages,
    isLoadingMessages,
    isSending,
    fetchMessages,
    sendMessage,
    setMessages
  };
};
