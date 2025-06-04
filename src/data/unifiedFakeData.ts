
import { KanbanLead, KanbanTag, FIXED_COLUMN_IDS } from "@/types/kanban";
import { Contact } from "@/types/chat";

// Tags unificadas para funil e chat
export const unifiedTags: KanbanTag[] = [
  { id: "tag-1", name: "Novo", color: "bg-blue-400" },
  { id: "tag-2", name: "Urgente", color: "bg-red-400" },
  { id: "tag-3", name: "Proposta Enviada", color: "bg-purple-400" },
  { id: "tag-4", name: "Reunião", color: "bg-green-400" },
  { id: "tag-5", name: "Desconto", color: "bg-amber-400" },
  { id: "tag-6", name: "VIP", color: "bg-yellow-400" },
  { id: "tag-7", name: "2ª Compra", color: "bg-emerald-400" },
  { id: "tag-8", name: "Preço Alto", color: "bg-orange-400" },
  { id: "tag-9", name: "Lead Quente", color: "bg-pink-400" },
  { id: "tag-10", name: "Premium", color: "bg-indigo-400" },
  { id: "tag-11", name: "Interessado", color: "bg-teal-400" },
  { id: "tag-12", name: "Retorno", color: "bg-cyan-400" },
  { id: "tag-13", name: "Corporativo", color: "bg-slate-400" },
  { id: "tag-14", name: "E-commerce", color: "bg-violet-400" },
  { id: "tag-15", name: "Freelancer", color: "bg-rose-400" },
  { id: "tag-16", name: "Startup", color: "bg-lime-400" },
  { id: "tag-17", name: "Agência", color: "bg-sky-400" },
  { id: "tag-18", name: "Educação", color: "bg-stone-400" },
  { id: "tag-19", name: "Saúde", color: "bg-emerald-500" },
  { id: "tag-20", name: "LGPD", color: "bg-gray-400" }
];

// 10 leads unificados para funil e chat
export const unifiedLeads: KanbanLead[] = [
  // ENTRADA DE LEAD - 4 leads
  {
    id: "lead-1",
    name: "João Silva",
    phone: "+5511987654321",
    lastMessage: "Olá, gostaria de saber mais sobre o serviço",
    lastMessageTime: "10:30",
    tags: [
      { id: "tag-1", name: "Novo", color: "bg-blue-400" },
      { id: "tag-2", name: "Urgente", color: "bg-red-400" },
      { id: "tag-9", name: "Lead Quente", color: "bg-pink-400" },
      { id: "tag-10", name: "Premium", color: "bg-indigo-400" }
    ],
    columnId: FIXED_COLUMN_IDS.NEW_LEAD,
    notes: "Cliente interessado em planos corporativos",
    purchaseValue: 2500
  },
  {
    id: "lead-2", 
    name: "Maria Oliveira",
    phone: "+5511912345678",
    lastMessage: "Qual o preço do plano básico?",
    lastMessageTime: "09:15",
    tags: [
      { id: "tag-1", name: "Novo", color: "bg-blue-400" },
      { id: "tag-9", name: "Lead Quente", color: "bg-pink-400" }
    ],
    columnId: FIXED_COLUMN_IDS.NEW_LEAD,
    notes: "Cliente interessado no plano básico, enviar proposta",
    purchaseValue: 800
  },
  {
    id: "lead-3",
    name: "Ana Silva", 
    phone: "+5511876543210",
    lastMessage: "Oi! Gostaria de saber mais sobre os planos",
    lastMessageTime: "14:30",
    tags: [
      { id: "tag-9", name: "Lead Quente", color: "bg-pink-400" },
      { id: "tag-10", name: "Premium", color: "bg-indigo-400" },
      { id: "tag-13", name: "Corporativo", color: "bg-slate-400" },
      { id: "tag-17", name: "Agência", color: "bg-sky-400" },
      { id: "tag-6", name: "VIP", color: "bg-yellow-400" }
    ],
    columnId: FIXED_COLUMN_IDS.NEW_LEAD,
    notes: "Interessada em planos premium para empresa",
    purchaseValue: 5000
  },
  {
    id: "lead-4",
    name: "Carlos Oliveira",
    phone: "+5511765432109", 
    lastMessage: "Perfeito! Quando podemos agendar?",
    lastMessageTime: "13:45",
    tags: [
      { id: "tag-11", name: "Interessado", color: "bg-teal-400" },
      { id: "tag-4", name: "Reunião", color: "bg-green-400" }
    ],
    columnId: FIXED_COLUMN_IDS.NEW_LEAD,
    notes: "Quer agendar reunião para próxima semana",
    purchaseValue: 1200
  },

  // EM CONTATO - 3 leads
  {
    id: "lead-5",
    name: "Pedro Santos", 
    phone: "+5511777788888",
    lastMessage: "Vou analisar a proposta, obrigado!",
    lastMessageTime: "Ontem",
    tags: [
      { id: "tag-3", name: "Proposta Enviada", color: "bg-purple-400" },
    ],
    columnId: "column-2",
    notes: "Proposta enviada ontem, aguardando retorno",
    purchaseValue: 3500
  },
  {
    id: "lead-6", 
    name: "Mariana Costa",
    phone: "+5511654321098",
    lastMessage: "Obrigada pelo atendimento! 😊",
    lastMessageTime: "12:20",
    tags: [
      { id: "tag-6", name: "VIP", color: "bg-yellow-400" },
      { id: "tag-12", name: "Retorno", color: "bg-cyan-400" },
      { id: "tag-7", name: "2ª Compra", color: "bg-emerald-400" }
    ],
    columnId: "column-2",
    notes: "Cliente VIP, segunda compra este ano",
    purchaseValue: 7500
  },
  {
    id: "lead-7",
    name: "Roberto Santos",
    phone: "+5511543210987",
    lastMessage: "Precisamos de uma proposta para 50 usuários", 
    lastMessageTime: "11:15",
    tags: [
      { id: "tag-13", name: "Corporativo", color: "bg-slate-400" },
      { id: "tag-2", name: "Urgente", color: "bg-red-400" }
    ],
    columnId: "column-2",
    notes: "Empresa grande, proposta para 50 licenças",
    purchaseValue: 15000
  },

  // NEGOCIAÇÃO - 3 leads  
  {
    id: "lead-8",
    name: "Ana Pereira",
    phone: "+5511666655555", 
    lastMessage: "Podemos agendar uma reunião?",
    lastMessageTime: "Seg",
    tags: [
      { id: "tag-4", name: "Reunião", color: "bg-green-400" },
      { id: "tag-5", name: "Desconto", color: "bg-amber-400" },
      { id: "tag-8", name: "Preço Alto", color: "bg-orange-400" }
    ],
    columnId: "column-3",
    notes: "Negociando desconto, reunião agendada",
    purchaseValue: 4200
  },
  {
    id: "lead-9", 
    name: "Juliana Fernandes",
    phone: "+5511432109876",
    lastMessage: "Qual o prazo para implementação?",
    lastMessageTime: "10:30",
    tags: [
      { id: "tag-14", name: "E-commerce", color: "bg-violet-400" },
      { id: "tag-2", name: "Urgente", color: "bg-red-400" },
      { id: "tag-16", name: "Startup", color: "bg-lime-400" },
      { id: "tag-19", name: "Saúde", color: "bg-emerald-500" }
    ],
    columnId: "column-3", 
    notes: "E-commerce, precisa implementar rapidamente",
    purchaseValue: 6800
  },
  {
    id: "lead-10",
    name: "Pedro Almeida", 
    phone: "+5511321098765",
    lastMessage: "Vou analisar e te retorno",
    lastMessageTime: "09:45",
    tags: [
      { id: "tag-15", name: "Freelancer", color: "bg-rose-400" },
      { id: "tag-5", name: "Desconto", color: "bg-amber-400" }
    ],
    columnId: "column-3",
    notes: "Freelancer, negociando desconto especial",
    purchaseValue: 980
  }
];

// Função para converter lead do funil para contato do chat
export const convertLeadToContact = (lead: KanbanLead): Contact => {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone.replace("+", ""),
    email: `${lead.name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
    address: "",
    company: getCompanyFromTags(lead.tags),
    notes: lead.notes || "",
    tags: lead.tags.map(tag => tag.name),
    lastMessage: lead.lastMessage,
    lastMessageTime: lead.lastMessageTime,
    unreadCount: getUnreadCount(lead.id),
    avatar: "",
    isOnline: Math.random() > 0.5,
    purchaseValue: lead.purchaseValue,
    assignedUser: lead.assignedUser
  };
};

// Função para converter contato do chat para lead do funil  
export const convertContactToLead = (contact: Contact): KanbanLead => {
  return {
    id: contact.id,
    name: contact.name,
    phone: contact.phone.startsWith("+") ? contact.phone : `+${contact.phone}`,
    lastMessage: contact.lastMessage || "",
    lastMessageTime: contact.lastMessageTime || "",
    tags: (contact.tags || []).map((tagName, index) => ({
      id: `tag-${index + 1}`,
      name: tagName,
      color: getTagColorByName(tagName)
    })),
    notes: contact.notes,
    columnId: FIXED_COLUMN_IDS.NEW_LEAD,
    purchaseValue: contact.purchaseValue,
    assignedUser: contact.assignedUser
  };
};

// Função auxiliar para obter empresa das tags
function getCompanyFromTags(tags: KanbanTag[]): string {
  const companyTags = {
    "Corporativo": "Consultoria RH",
    "E-commerce": "E-commerce Plus", 
    "Freelancer": "Freelancer",
    "Startup": "Startup Innovation",
    "Agência": "Agência Criativa",
    "Educação": "Educação Online",
    "Saúde": "Clínica Médica",
    "Premium": "Tech Solutions",
    "VIP": "Marketing Digital"
  };

  for (const tag of tags) {
    if (companyTags[tag.name as keyof typeof companyTags]) {
      return companyTags[tag.name as keyof typeof companyTags];
    }
  }
  return "";
}

// Função auxiliar para obter cor da tag por nome
function getTagColorByName(tagName: string): string {
  const tag = unifiedTags.find(t => t.name === tagName);
  return tag?.color || "bg-gray-400";
}

// Função auxiliar para simular contagem de não lidas
function getUnreadCount(leadId: string): number {
  const unreadMap: { [key: string]: number } = {
    "lead-1": 3,
    "lead-2": 1, 
    "lead-3": 3,
    "lead-4": 1,
    "lead-5": 0,
    "lead-6": 0,
    "lead-7": 2,
    "lead-8": 0,
    "lead-9": 5, 
    "lead-10": 0
  };
  return unreadMap[leadId] || 0;
}
