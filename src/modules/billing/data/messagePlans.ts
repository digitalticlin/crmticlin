
import { MessagePlan } from '../types/billing';

export const messagePlans: MessagePlan[] = [
  {
    id: 'messages_1k',
    name: 'Plano Básico',
    price: 29.90,
    message_limit: 1000,
    description: 'Ideal para pequenos negócios começando com automação',
    features: [
      '1.000 mensagens por mês',
      'Agentes de IA ilimitados',
      'Suporte por email',
      'Dashboard básico'
    ],
    stripe_price_id: 'price_1k_messages' // Substitua pelo ID real do Stripe
  },
  {
    id: 'messages_3k',
    name: 'Plano Profissional',
    price: 79.90,
    message_limit: 3000,
    description: 'Para empresas com operação média de atendimento',
    features: [
      '3.000 mensagens por mês',
      'Agentes de IA ilimitados',
      'Suporte prioritário',
      'Dashboard avançado',
      'Relatórios detalhados'
    ],
    stripe_price_id: 'price_3k_messages' // Substitua pelo ID real do Stripe
  },
  {
    id: 'messages_5k',
    name: 'Plano Enterprise',
    price: 129.90,
    message_limit: 5000,
    description: 'Para grandes operações com alto volume',
    features: [
      '5.000 mensagens por mês',
      'Agentes de IA ilimitados',
      'Suporte 24/7',
      'Dashboard premium',
      'API dedicada',
      'Gerente de conta'
    ],
    stripe_price_id: 'price_5k_messages' // Substitua pelo ID real do Stripe
  }
];

export const getPlanByType = (planType: string): MessagePlan | undefined => {
  return messagePlans.find(plan => plan.id === planType);
};

export const getPlanLimit = (planType: string): number => {
  const plan = getPlanByType(planType);
  return plan?.message_limit || 0;
};
