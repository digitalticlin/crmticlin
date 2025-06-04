import { useState, useEffect, useCallback } from 'react';
import { Contact, Message } from '@/types/chat';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';
import { toast } from "sonner";

/**
 * Hook especializado para chat WhatsApp Web.js - experiência real
 */
export const useWhatsAppWebChat = (activeInstance: WhatsAppWebInstance | null) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Contatos fake para teste
  const getFakeContacts = useCallback((): Contact[] => {
    return [
      {
        id: 'fake-1',
        name: 'Ana Silva',
        phone: '5511987654321',
        email: 'ana@email.com',
        address: '',
        company: 'Tech Solutions',
        notes: '',
        tags: ['Lead Quente', 'Premium'],
        lastMessage: 'Oi! Gostaria de saber mais sobre os planos',
        lastMessageTime: '14:30',
        unreadCount: 3,
        avatar: '',
        isOnline: true
      },
      {
        id: 'fake-2',
        name: 'Carlos Oliveira',
        phone: '5511876543210',
        email: 'carlos@email.com',
        address: '',
        company: 'Marketing Digital',
        notes: '',
        tags: ['Interessado'],
        lastMessage: 'Perfeito! Quando podemos agendar?',
        lastMessageTime: '13:45',
        unreadCount: 1,
        avatar: '',
        isOnline: false
      },
      {
        id: 'fake-3',
        name: 'Mariana Costa',
        phone: '5511765432109',
        email: 'mariana@email.com',
        address: '',
        company: '',
        notes: '',
        tags: ['VIP', 'Retorno'],
        lastMessage: 'Obrigada pelo atendimento! 😊',
        lastMessageTime: '12:20',
        unreadCount: 0,
        avatar: '',
        isOnline: true
      },
      {
        id: 'fake-4',
        name: 'Roberto Santos',
        phone: '5511654321098',
        email: 'roberto@email.com',
        address: '',
        company: 'Consultoria RH',
        notes: '',
        tags: ['Corporativo'],
        lastMessage: 'Precisamos de uma proposta para 50 usuários',
        lastMessageTime: '11:15',
        unreadCount: 2,
        avatar: '',
        isOnline: false
      },
      {
        id: 'fake-5',
        name: 'Juliana Fernandes',
        phone: '5511543210987',
        email: 'juliana@email.com',
        address: '',
        company: 'E-commerce Plus',
        notes: '',
        tags: ['E-commerce', 'Urgente'],
        lastMessage: 'Qual o prazo para implementação?',
        lastMessageTime: '10:30',
        unreadCount: 5,
        avatar: '',
        isOnline: true
      },
      {
        id: 'fake-6',
        name: 'Pedro Almeida',
        phone: '5511432109876',
        email: 'pedro@email.com',
        address: '',
        company: '',
        notes: '',
        tags: ['Freelancer'],
        lastMessage: 'Vou analisar e te retorno',
        lastMessageTime: '09:45',
        unreadCount: 0,
        avatar: '',
        isOnline: false
      },
      {
        id: 'fake-7',
        name: 'Luciana Rodrigues',
        phone: '5511321098765',
        email: 'luciana@email.com',
        address: '',
        company: 'Startup Innovation',
        notes: '',
        tags: ['Startup', 'Desconto'],
        lastMessage: 'Vocês têm desconto para startups?',
        lastMessageTime: '08:20',
        unreadCount: 1,
        avatar: '',
        isOnline: true
      },
      {
        id: 'fake-8',
        name: 'Fernando Lima',
        phone: '5511210987654',
        email: 'fernando@email.com',
        address: '',
        company: 'Agência Criativa',
        notes: '',
        tags: ['Agência', 'Revenda'],
        lastMessage: 'Interessado no programa de revenda',
        lastMessageTime: '07:55',
        unreadCount: 0,
        avatar: '',
        isOnline: false
      },
      {
        id: 'fake-9',
        name: 'Gabriela Souza',
        phone: '5511109876543',
        email: 'gabriela@email.com',
        address: '',
        company: 'Educação Online',
        notes: '',
        tags: ['Educação', 'Mensal'],
        lastMessage: 'Preciso do plano mensal mesmo',
        lastMessageTime: 'ontem',
        unreadCount: 0,
        avatar: '',
        isOnline: true
      },
      {
        id: 'fake-10',
        name: 'Daniel Barbosa',
        phone: '5511098765432',
        email: 'daniel@email.com',
        address: '',
        company: 'Clínica Médica',
        notes: '',
        tags: ['Saúde', 'LGPD'],
        lastMessage: 'Como funciona a segurança dos dados?',
        lastMessageTime: 'ontem',
        unreadCount: 0,
        avatar: '',
        isOnline: false
      }
    ];
  }, []);

  // Função para ordenar contatos automaticamente
  const sortContacts = useCallback((contactsList: Contact[]) => {
    return [...contactsList].sort((a, b) => {
      // Conversas não lidas primeiro
      if (a.unreadCount && a.unreadCount > 0 && (!b.unreadCount || b.unreadCount === 0)) return -1;
      if ((!a.unreadCount || a.unreadCount === 0) && b.unreadCount && b.unreadCount > 0) return 1;
      
      // Depois ordenar por última mensagem (mais recente primeiro)
      if (!a.lastMessageTime && !b.lastMessageTime) return 0;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      
      // Comparar timestamps convertidos para números para ordenação correta
      const timeA = new Date(a.lastMessageTime).getTime();
      const timeB = new Date(b.lastMessageTime).getTime();
      return timeB - timeA;
    });
  }, []);

  // Função para mover contato para o topo quando receber nova mensagem
  const moveContactToTop = useCallback((contactId: string) => {
    setContacts(prevContacts => {
      const contactIndex = prevContacts.findIndex(c => c.id === contactId);
      if (contactIndex === -1) return prevContacts;
      
      const updatedContacts = [...prevContacts];
      const [contact] = updatedContacts.splice(contactIndex, 1);
      
      // Atualizar timestamp da última mensagem para agora
      const updatedContact = {
        ...contact,
        lastMessageTime: new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      
      // Inserir no topo
      updatedContacts.unshift(updatedContact);
      
      console.log('[WhatsApp Web Chat] 📈 Moved contact to top:', contact.name);
      return updatedContacts;
    });
  }, []);

  // Buscar contatos (leads) da instância ativa
  const fetchContacts = useCallback(async () => {
    if (!activeInstance) {
      // Se não há instância ativa, mostrar contatos fake para demonstração
      const fakeContacts = getFakeContacts();
      const sortedContacts = sortContacts(fakeContacts);
      setContacts(sortedContacts);
      return;
    }

    setIsLoadingContacts(true);
    try {
      console.log('[WhatsApp Web Chat] 📋 Fetching contacts for instance:', activeInstance.id);

      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          *,
          lead_tags!inner(
            tag_id,
            tags(name, color)
          )
        `)
        .eq('whatsapp_number_id', activeInstance.id)
        .eq('company_id', activeInstance.company_id)
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const mappedContacts: Contact[] = (leads || []).map(lead => {
        // Extrair tags do relacionamento
        const leadTags = lead.lead_tags?.map((lt: any) => lt.tags?.name).filter(Boolean) || [];
        
        return {
          id: lead.id,
          name: lead.name || `+${lead.phone}`,
          phone: lead.phone,
          email: lead.email || '',
          address: lead.address || '',
          company: lead.company || '',
          notes: lead.notes || '',
          tags: leadTags,
          lastMessage: lead.last_message || '',
          lastMessageTime: lead.last_message_time 
            ? new Date(lead.last_message_time).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            : '',
          unreadCount: lead.unread_count || 0,
          avatar: '',
          isOnline: Math.random() > 0.7 // Simulação básica de status online
        };
      });

      // Se não há leads reais, adicionar contatos fake para demonstração
      const fakeContacts = getFakeContacts();
      const allContacts = [...mappedContacts, ...fakeContacts];

      const sortedContacts = sortContacts(allContacts);
      console.log('[WhatsApp Web Chat] ✅ Contacts fetched and sorted:', sortedContacts.length);
      setContacts(sortedContacts);
    } catch (error) {
      console.error('[WhatsApp Web Chat] ❌ Error fetching contacts:', error);
      // Em caso de erro, mostrar pelo menos os contatos fake
      const fakeContacts = getFakeContacts();
      const sortedContacts = sortContacts(fakeContacts);
      setContacts(sortedContacts);
      toast.error('Erro ao carregar contatos - mostrando dados de demonstração');
    } finally {
      setIsLoadingContacts(false);
    }
  }, [activeInstance, sortContacts, getFakeContacts]);

  // Buscar mensagens do contato selecionado
  const fetchMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      console.log('[WhatsApp Web Chat] 💬 Fetching messages for contact:', selectedContact.id);

      const { data: dbMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const mappedMessages: Message[] = (dbMessages || []).map(msg => ({
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

      console.log('[WhatsApp Web Chat] ✅ Messages fetched:', mappedMessages.length);
      setMessages(mappedMessages);
    } catch (error) {
      console.error('[WhatsApp Web Chat] ❌ Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedContact, activeInstance]);

  // Enviar mensagem via WhatsApp Web.js - VERSÃO MELHORADA COM OTIMIZAÇÃO
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!selectedContact || !activeInstance || !text.trim()) {
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
          await fetchContacts();
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
    } catch (error) {
      console.error('[WhatsApp Web Chat] ❌ Error sending message:', error);
      
      // Remover mensagem otimista em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      toast.error('Erro inesperado ao enviar mensagem');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, activeInstance, fetchMessages, fetchContacts]);

  // Configurar realtime para novas mensagens com movimentação automática
  useEffect(() => {
    if (!activeInstance) return;

    console.log('[WhatsApp Web Chat] 🔄 Setting up realtime for instance:', activeInstance.id);

    const channel = supabase
      .channel('whatsapp-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `whatsapp_number_id=eq.${activeInstance.id}`
        },
        (payload) => {
          console.log('[WhatsApp Web Chat] 🔄 Nova mensagem recebida via realtime:', payload);
          
          const newMessage = payload.new as any;
          
          // Mover contato para o topo se recebeu nova mensagem
          if (newMessage.lead_id && !newMessage.from_me) {
            moveContactToTop(newMessage.lead_id);
          }
          
          // Se é mensagem do contato selecionado, atualizar mensagens
          if (selectedContact && newMessage.lead_id === selectedContact.id) {
            console.log('[WhatsApp Web Chat] Updating messages for selected contact');
            fetchMessages();
          }
          
          // Sempre atualizar lista de contatos
          console.log('[WhatsApp Web Chat] Updating contacts list');
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      console.log('[WhatsApp Web Chat] 🧹 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [activeInstance, selectedContact, fetchMessages, fetchContacts, moveContactToTop]);

  // Carregar contatos quando instância mudar
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Carregar mensagens quando contato selecionado mudar
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending,
    fetchContacts,
    fetchMessages
  };
};
