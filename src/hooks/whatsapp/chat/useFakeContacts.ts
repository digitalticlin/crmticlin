
// FASE 3: Contatos fake para demonstração (quando não há dados reais)
import { Contact } from '@/types/chat';

export const useFakeContacts = () => {
  const getFakeContacts = (): Contact[] => [
    {
      id: 'fake-1',
      name: 'João Silva',
      phone: '5511987654321',
      email: 'joao.silva@email.com',
      company: 'Empresa ABC',
      lastMessage: 'Olá, gostaria de mais informações sobre o produto.',
      lastMessageTime: '14:30',
      unreadCount: 2,
      avatar: '',
      isOnline: true,
      tags: ['Interessado', 'Novo Cliente']
    },
    {
      id: 'fake-2',
      name: 'Maria Santos',
      phone: '5511976543210',
      email: 'maria.santos@email.com',
      company: 'Empresa XYZ',
      lastMessage: 'Muito obrigada pelo atendimento!',
      lastMessageTime: '13:45',
      unreadCount: 0,
      avatar: '',
      isOnline: false,
      tags: ['Cliente Ativo']
    },
    {
      id: 'fake-3',
      name: 'Pedro Costa',
      phone: '5511965432109',
      email: '',
      company: '',
      lastMessage: 'Quando vocês podem fazer a entrega?',
      lastMessageTime: '12:20',
      unreadCount: 1,
      avatar: '',
      isOnline: true,
      tags: ['Urgente']
    }
  ];

  return { getFakeContacts };
};
