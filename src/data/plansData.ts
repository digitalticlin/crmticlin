
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
  };
}

export const plansData: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 99,
    description: "Ideal para pequenas empresas começando no WhatsApp",
    features: [
      "1 número de WhatsApp",
      "3 membros de equipe",
      "Funil Kanban básico",
      "Chat WhatsApp integrado",
      "Suporte por e-mail"
    ],
    limits: {
      whatsappNumbers: 1,
      teamMembers: 3,
      aiAgents: 0
    }
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    description: "Para empresas com operação de vendas estabelecida",
    features: [
      "5 números de WhatsApp",
      "10 membros de equipe",
      "Funil Kanban avançado",
      "Etiquetas e categorias",
      "3 Agentes de IA",
      "Suporte prioritário"
    ],
    limits: {
      whatsappNumbers: 5,
      teamMembers: 10,
      aiAgents: 3
    }
  },
  {
    id: "business",
    name: "Business",
    price: 399,
    description: "Para operações comerciais completas",
    features: [
      "Números de WhatsApp ilimitados",
      "Usuários ilimitados",
      "Funil Kanban premium",
      "Automações avançadas",
      "10 Agentes de IA",
      "API de integração",
      "Gerente de conta dedicado"
    ],
    limits: {
      whatsappNumbers: 999,
      teamMembers: 999,
      aiAgents: 10
    }
  }
];
