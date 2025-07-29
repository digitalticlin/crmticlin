
import { messagePlans } from '@/modules/billing/data/messagePlans';

// Re-exportar os planos de mensagens para manter compatibilidade
export const plansData = messagePlans.map(plan => ({
  id: plan.id,
  name: plan.name,
  price: plan.price,
  description: plan.description,
  features: plan.features,
  limits: {
    whatsappNumbers: 999, // Ilimitado para todos os planos
    teamMembers: 999,     // Ilimitado para todos os planos
    aiAgents: 999,        // Ilimitado para todos os planos
    messages: plan.message_limit // Limite específico por plano
  }
}));

// Manter interface original para compatibilidade
export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: {
    whatsappNumbers: number;
    teamMembers: number;
    aiAgents: number;
    messages: number;
  };
}
