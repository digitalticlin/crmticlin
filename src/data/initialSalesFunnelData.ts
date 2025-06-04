
import { FIXED_COLUMN_IDS, KanbanColumn } from "@/types/kanban";
import { unifiedLeads, unifiedTags } from "./unifiedFakeData";

export const initialColumns: KanbanColumn[] = [
  {
    id: FIXED_COLUMN_IDS.NEW_LEAD,
    title: "ENTRADA DE LEAD",
    isFixed: true,
    leads: unifiedLeads.filter(lead => lead.columnId === FIXED_COLUMN_IDS.NEW_LEAD),
  },
  {
    id: "column-2",
    title: "Em Contato",
    leads: unifiedLeads.filter(lead => lead.columnId === "column-2"),
  },
  {
    id: "column-3", 
    title: "Negociação",
    leads: unifiedLeads.filter(lead => lead.columnId === "column-3"),
  },
  {
    id: FIXED_COLUMN_IDS.WON,
    title: "GANHO",
    isFixed: true,
    isHidden: true,
    leads: [
      {
        id: "lead-won-1",
        name: "Carlos Mendes",
        phone: "+55 11 99876-5432",
        lastMessage: "Fechado! Vou efetuar o pagamento hoje.",
        lastMessageTime: "3d",
        tags: [
          { id: "tag-6", name: "VIP", color: "bg-yellow-400" },
          { id: "tag-7", name: "2ª Compra", color: "bg-emerald-400" },
        ],
        columnId: FIXED_COLUMN_IDS.WON,
        purchaseValue: 8500
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
        id: "lead-lost-1",
        name: "Lucia Ferreira",
        phone: "+55 11 91111-2222",
        lastMessage: "Obrigada, mas optei por outro serviço.",
        lastMessageTime: "5d",
        tags: [
          { id: "tag-8", name: "Preço Alto", color: "bg-orange-400" },
        ],
        columnId: FIXED_COLUMN_IDS.LOST,
        notes: "Cliente achou o valor acima do orçamento, talvez retornar com promoção futura."
      }
    ],
  },
];

export const initialTags = unifiedTags;
