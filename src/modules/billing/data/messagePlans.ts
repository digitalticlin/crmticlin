
import { MessagePlan } from '../types/billing';

export const messagePlans: MessagePlan[] = [
  {
    id: 'free_200',
    name: 'Gratuito',
    price: 0.00,
    message_limit: 200,
    description: 'Apenas uma vez por usuário',
    features: [
      '200 mensagens de IA',
      '1 usuário',
      '1 WhatsApp conectado',
      'Leads ilimitados',
      'Acesso ilimitado ao CRM'
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
      '**5.000 mensagens de IA/mês**',
      '3 Agentes de IA',
      '3 membros operacionais',
      '3 WhatsApps conectados',
      'Acesso ilimitado ao CRM',
      'Leads ilimitados'
    ],
    stripe_price_id: 'price_1SCp3t7ISCuoutHEgWMN1d9t',
    max_users: 3,
    max_whatsapp_numbers: 3
  },
  {
    id: 'ultra_15k',
    name: 'Ultra',
    price: 799.00,
    message_limit: 15000,
    description: 'Para operações de alto volume',
    features: [
      '**15.000 mensagens de IA/mês**',
      'Agentes de IA ilimitados',
      'Membros operacionais ilimitados',
      'WhatsApps ilimitados',
      'Acesso ilimitado ao CRM',
      'Leads ilimitados'
    ],
    stripe_price_id: 'price_1SCp4E7ISCuoutHEQXz86ghq',
    is_popular: true,
    max_users: -1,
    max_whatsapp_numbers: -1
  }
];

export const getPlanByType = (planType: string): MessagePlan | undefined => {
  return messagePlans.find(plan => plan.id === planType);
};

export const getPlanLimit = (planType: string): number => {
  const plan = getPlanByType(planType);
  return plan?.message_limit || 0;
};
