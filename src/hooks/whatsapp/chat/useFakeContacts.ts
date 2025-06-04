
import { useCallback } from 'react';
import { Contact } from '@/types/chat';

/**
 * Hook para gerenciar contatos fake para demonstração
 */
export const useFakeContacts = () => {
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

  return { getFakeContacts };
};
