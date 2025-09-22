
import { MessagePlan } from '../types/billing';

export const messagePlans: MessagePlan[] = [
  {
    id: 'free_200',
    name: 'Gratuito',
    price: 0.00,
    message_limit: 200,
    description: 'Teste grátis por 30 dias (apenas uma vez por usuário)',
    features: [
      '200 mensagens de IA/mês',
      'Agentes de IA ilimitados',
      'Suporte pelo WhatsApp',
      'Apenas administrador',
      '1 número WhatsApp'
    ],
    stripe_price_id: 'free_trial',
    is_trial: true,
    max_users: 1,
    max_whatsapp_numbers: 1
  },
  {
    id: 'pro_5k',
    name: 'Profissional',
    price: 399.00,
    message_limit: 5000,
    description: 'Ideal para empresas em crescimento',
    features: [
      '5.000 mensagens de IA/mês',
      'Agentes de IA ilimitados',
      'Suporte pelo WhatsApp',
      '2 membros operacionais',
      'Até 3 números WhatsApp'
    ],
    stripe_price_id: 'mp_pro_5k',
    max_users: 2,
    max_whatsapp_numbers: 3
  },
  {
    id: 'ultra_15k',
    name: 'Ultra',
    price: 799.00,
    message_limit: 15000,
    description: 'Para operações de alto volume',
    features: [
      '15.000 mensagens de IA/mês',
      'Agentes de IA ilimitados',
      'Suporte pelo WhatsApp',
      'Membros operacionais ilimitados',
      'Números WhatsApp ilimitados'
    ],
    stripe_price_id: 'mp_ultra_15k',
    max_users: -1, // -1 = ilimitado
    max_whatsapp_numbers: -1 // -1 = ilimitado
  }
];

export const getPlanByType = (planType: string): MessagePlan | undefined => {
  return messagePlans.find(plan => plan.id === planType);
};

export const getPlanLimit = (planType: string): number => {
  const plan = getPlanByType(planType);
  return plan?.message_limit || 0;
};
