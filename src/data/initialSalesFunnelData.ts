
import { FIXED_COLUMN_IDS, KanbanColumn, KanbanTag } from "@/types/kanban";

export const initialColumns: KanbanColumn[] = [
  {
    id: FIXED_COLUMN_IDS.NEW_LEAD,
    title: "ENTRADA DE LEAD",
    isFixed: true,
    leads: [
      {
        id: "lead-1",
        name: "João Silva",
        phone: "+55 11 98765-4321",
        lastMessage: "Olá, gostaria de saber mais sobre o serviço",
        lastMessageTime: "10:30",
        tags: [
          { id: "tag-1", name: "Novo", color: "bg-blue-400" },
          { id: "tag-2", name: "Urgente", color: "bg-red-400" },
        ],
      },
      {
        id: "lead-2",
        name: "Maria Oliveira",
        phone: "+55 11 91234-5678",
        lastMessage: "Qual o preço do plano básico?",
        lastMessageTime: "09:15",
        tags: [
          { id: "tag-1", name: "Novo", color: "bg-blue-400" },
        ],
        notes: "Cliente interessado no plano básico, enviar proposta",
      },
    ],
  },
  {
    id: "column-2",
    title: "Em Contato",
    leads: [
      {
        id: "lead-3",
        name: "Pedro Santos",
        phone: "+55 11 97777-8888",
        lastMessage: "Vou analisar a proposta, obrigado!",
        lastMessageTime: "Ontem",
        tags: [
          { id: "tag-3", name: "Proposta Enviada", color: "bg-purple-400" },
        ],
      },
    ],
  },
  {
    id: "column-3",
    title: "Negociação",
    leads: [
      {
        id: "lead-4",
        name: "Ana Pereira",
        phone: "+55 11 96666-5555",
        lastMessage: "Podemos agendar uma reunião?",
        lastMessageTime: "Seg",
        tags: [
          { id: "tag-4", name: "Reunião", color: "bg-green-400" },
          { id: "tag-5", name: "Desconto", color: "bg-amber-400" },
        ],
      },
    ],
  },
  {
    id: FIXED_COLUMN_IDS.WON,
    title: "GANHO",
    isFixed: true,
    isHidden: true,
    leads: [
      {
        id: "lead-5",
        name: "Carlos Mendes",
        phone: "+55 11 99876-5432",
        lastMessage: "Fechado! Vou efetuar o pagamento hoje.",
        lastMessageTime: "3d",
        tags: [
          { id: "tag-6", name: "VIP", color: "bg-yellow-400" },
          { id: "tag-7", name: "2ª Compra", color: "bg-emerald-400" },
        ],
      }
    ],
  },
  {
    id: FIXED_COLUMN_IDS.LOST,
    title: "PERDIDO",
    isFixed: true,
    isHidden: true,
    leads: [
      {
        id: "lead-6",
        name: "Lucia Ferreira",
        phone: "+55 11 91111-2222",
        lastMessage: "Obrigada, mas optei por outro serviço.",
        lastMessageTime: "5d",
        tags: [
          { id: "tag-8", name: "Preço Alto", color: "bg-orange-400" },
        ],
        notes: "Cliente achou o valor acima do orçamento, talvez retornar com promoção futura."
      }
    ],
  },
];

export const initialTags: KanbanTag[] = [
  { id: "tag-1", name: "Novo", color: "bg-blue-400" },
  { id: "tag-2", name: "Urgente", color: "bg-red-400" },
  { id: "tag-3", name: "Proposta Enviada", color: "bg-purple-400" },
  { id: "tag-4", name: "Reunião", color: "bg-green-400" },
  { id: "tag-5", name: "Desconto", color: "bg-amber-400" },
  { id: "tag-6", name: "VIP", color: "bg-yellow-400" },
  { id: "tag-7", name: "2ª Compra", color: "bg-emerald-400" },
  { id: "tag-8", name: "Preço Alto", color: "bg-orange-400" },
];
