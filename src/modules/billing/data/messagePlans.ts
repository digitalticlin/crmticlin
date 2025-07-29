
import { MessagePlan } from '../types/billing';

export const messagePlans: MessagePlan[] = [
  {
    id: 'messages_1k',
    name: 'Básico',
    price: 99.00,
    message_limit: 1000,
    description: 'Perfeito para começar a automatizar seu WhatsApp',
    features: [
      '1.000 mensagens de IA/mês',
      'Agentes de IA ilimitados',
      'Suporte pelo WhatsApp',
      '2 usuários',
      '1 número WhatsApp'
    ],
    stripe_price_id: 'price_1k_messages'
  },
  {
    id: 'messages_5k',
    name: 'Profissional',
    price: 399.00,
    message_limit: 5000,
    description: 'Ideal para empresas em crescimento',
    features: [
      '5.000 mensagens de IA/mês',
      'Agentes de IA ilimitados',
      'Suporte pelo WhatsApp',
      'Usuários ilimitados',
      'Até 3 números WhatsApp'
    ],
    stripe_price_id: 'price_5k_messages'
  },
  {
    id: 'messages_15k',
    name: 'Ultra',
    price: 699.00,
    message_limit: 15000,
    description: 'Para operações de alto volume',
    features: [
      '15.000 mensagens de IA/mês',
      'Agentes de IA ilimitados',
      'Suporte pelo WhatsApp',
      'Usuários ilimitados',
      'Números WhatsApp ilimitados'
    ],
    stripe_price_id: 'price_15k_messages'
  }
];

export const getPlanByType = (planType: string): MessagePlan | undefined => {
  return messagePlans.find(plan => plan.id === planType);
};

export const getPlanLimit = (planType: string): number => {
  const plan = getPlanByType(planType);
  return plan?.message_limit || 0;
};
