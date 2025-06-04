import { Contact } from "@/types/chat";
import { KanbanLead, KanbanStage, KanbanTag } from "@/types/kanban";

export const kanbanTags = [
  { id: "1", name: "Importante", color: "red" },
  { id: "2", name: "Em Andamento", color: "blue" },
  { id: "3", name: "Concluído", color: "green" },
  { id: "4", name: "Aguardando", color: "yellow" },
  { id: "5", name: "Cancelado", color: "gray" },
];

export const kanbanStages: KanbanStage[] = [
  { id: "1", title: "Backlog", color: "gray", order: 1, isFixed: true },
  { id: "2", title: "Em Andamento", color: "blue", order: 2, isFixed: false },
  { id: "3", title: "Em Revisão", color: "yellow", order: 3, isFixed: false },
  { id: "4", title: "Concluído", color: "green", order: 4, isFixed: true, isWon: true },
  { id: "5", title: "Cancelado", color: "red", order: 5, isFixed: true, isLost: true }
];

export const contacts: Contact[] = [
  {
    id: "1",
    name: "João Silva",
    phone: "+55 11 91234-5678",
    email: "joao.silva@example.com",
    address: "Rua Exemplo, 123",
    tags: ["Importante", "Em Andamento"],
    notes: "Cliente antigo, sempre paga em dia.",
    assignedUser: "Maria Souza",
    lastMessageTime: "10:00",
    lastMessage: "Tudo certo com o projeto?",
    unreadCount: 0,
    avatar: "https://github.com/shadcn.png",
    company: "Empresa A",
    createdAt: "2021-09-01T10:00:00.000Z",
    deals: [
      {
        id: "1",
        status: "won",
        value: 1000,
        date: "2021-08-01",
        note: "Primeiro negócio fechado"
      }
    ],
    isOnline: true
  },
  {
    id: "2",
    name: "Maria Souza",
    phone: "+55 11 92345-6789",
    email: "maria.souza@example.com",
    address: "Avenida Teste, 456",
    tags: ["Concluído"],
    notes: "Entregou tudo antes do prazo.",
    assignedUser: "João Silva",
    lastMessageTime: "11:00",
    lastMessage: "Projeto finalizado com sucesso!",
    unreadCount: 1,
    avatar: "https://github.com/mrmartineau.png",
    company: "Empresa B",
    createdAt: "2021-09-01T11:00:00.000Z",
    deals: [
      {
        id: "2",
        status: "lost",
        value: 2000,
        date: "2021-08-01",
        note: "Não aprovou o orçamento"
      }
    ],
    isOnline: false
  },
  {
    id: "3",
    name: "Carlos Ferreira",
    phone: "+55 11 93456-7890",
    email: "carlos.ferreira@example.com",
    address: "Rua dos Bobos, 0",
    tags: ["Aguardando"],
    notes: "Aguardando aprovação do orçamento.",
    assignedUser: "Maria Souza",
    lastMessageTime: "12:00",
    lastMessage: "Ainda não recebi o orçamento.",
    unreadCount: 2,
    avatar: "https://github.com/leeerob.png",
    company: "Empresa C",
    createdAt: "2021-09-01T12:00:00.000Z",
    deals: [],
    isOnline: true
  },
  {
    id: "4",
    name: "Ana Paula",
    phone: "+55 11 94567-8901",
    email: "ana.paula@example.com",
    address: "Avenida Principal, 789",
    tags: ["Cancelado"],
    notes: "Cancelou o contrato.",
    assignedUser: "João Silva",
    lastMessageTime: "13:00",
    lastMessage: "Não tenho mais interesse.",
    unreadCount: 3,
    avatar: "https://github.com/emilkowalski.png",
    company: "Empresa D",
    createdAt: "2021-09-01T13:00:00.000Z",
    deals: [],
    isOnline: false
  },
  {
    id: "5",
    name: "Ricardo Oliveira",
    phone: "+55 11 95678-9012",
    email: "ricardo.oliveira@example.com",
    address: "Rua Secundária, 101",
    tags: ["Importante", "Concluído"],
    notes: "Cliente VIP, sempre indica novos clientes.",
    assignedUser: "Maria Souza",
    lastMessageTime: "14:00",
    lastMessage: "Indiquei um novo cliente para vocês.",
    unreadCount: 0,
    avatar: "https://github.com/rauchg.png",
    company: "Empresa E",
    createdAt: "2021-09-01T14:00:00.000Z",
    deals: [
      {
        id: "3",
        status: "won",
        value: 3000,
        date: "2021-08-01",
        note: "Segundo negócio fechado"
      }
    ],
    isOnline: true
  },
  {
    id: "6",
    name: "Fernanda Lima",
    phone: "+55 11 96789-0123",
    email: "fernanda.lima@example.com",
    address: "Avenida Central, 202",
    tags: ["Em Andamento"],
    notes: "Projeto em fase de testes.",
    assignedUser: "João Silva",
    lastMessageTime: "15:00",
    lastMessage: "Estamos quase finalizando os testes.",
    unreadCount: 1,
    avatar: "https://github.com/steventey.png",
    company: "Empresa F",
    createdAt: "2021-09-01T15:00:00.000Z",
    deals: [],
    isOnline: false
  },
  {
    id: "7",
    name: "Paulo Roberto",
    phone: "+55 11 97890-1234",
    email: "paulo.roberto@example.com",
    address: "Rua Lateral, 303",
    tags: ["Aguardando"],
    notes: "Aguardando feedback do cliente.",
    assignedUser: "Maria Souza",
    lastMessageTime: "16:00",
    lastMessage: "Aguardando seu feedback.",
    unreadCount: 2,
    avatar: "https://github.com/ztanner.png",
    company: "Empresa G",
    createdAt: "2021-09-01T16:00:00.000Z",
    deals: [],
    isOnline: true
  },
  {
    id: "8",
    name: "Juliana Garcia",
    phone: "+55 11 98901-2345",
    email: "juliana.garcia@example.com",
    address: "Avenida Paralela, 404",
    tags: ["Cancelado"],
    notes: "Cancelou o serviço por falta de verba.",
    assignedUser: "João Silva",
    lastMessageTime: "17:00",
    lastMessage: "Infelizmente, não temos verba para continuar.",
    unreadCount: 3,
    avatar: "https://github.com/pacocoursey.png",
    company: "Empresa H",
    createdAt: "2021-09-01T17:00:00.000Z",
    deals: [],
    isOnline: false
  },
  {
    id: "9",
    name: "Lucas Mendes",
    phone: "+55 11 99012-3456",
    email: "lucas.mendes@example.com",
    address: "Rua Transversal, 505",
    tags: ["Importante", "Em Andamento"],
    notes: "Cliente estratégico, grande potencial de crescimento.",
    assignedUser: "Maria Souza",
    lastMessageTime: "18:00",
    lastMessage: "Vamos marcar uma reunião para discutir o futuro.",
    unreadCount: 0,
    avatar: "https://github.com/rauchg.png",
    company: "Empresa I",
    createdAt: "2021-09-01T18:00:00.000Z",
    deals: [
      {
        id: "4",
        status: "won",
        value: 4000,
        date: "2021-08-01",
        note: "Quarto negócio fechado"
      }
    ],
    isOnline: true
  },
  {
    id: "10",
    name: "Beatriz Costa",
    phone: "+55 11 90123-4567",
    email: "beatriz.costa@example.com",
    address: "Avenida Diagonal, 606",
    tags: ["Concluído"],
    notes: "Entregou tudo antes do prazo, cliente muito satisfeita.",
    assignedUser: "João Silva",
    lastMessageTime: "19:00",
    lastMessage: "Adorei o resultado, muito obrigada!",
    unreadCount: 1,
    avatar: "https://github.com/steventey.png",
    company: "Empresa J",
    createdAt: "2021-09-01T19:00:00.000Z",
    deals: [],
    isOnline: false
  }
];

export const leads: KanbanLead[] = [
  {
    id: "1",
    name: "João Silva",
    phone: "+55 11 91234-5678",
    email: "joao.silva@example.com",
    company: "Empresa A",
    notes: "Cliente antigo, sempre paga em dia.",
    kanbanStageId: "1",
    tags: ["Importante", "Em Andamento"],
    assignedUser: "Maria Souza",
    lastMessage: "Tudo certo com o projeto?",
    lastMessageTime: "10:00",
    createdAt: "2021-09-01T10:00:00.000Z"
  },
  {
    id: "2",
    name: "Maria Souza",
    phone: "+55 11 92345-6789",
    email: "maria.souza@example.com",
    company: "Empresa B",
    notes: "Entregou tudo antes do prazo.",
    kanbanStageId: "2",
    tags: ["Concluído"],
    assignedUser: "João Silva",
    lastMessage: "Projeto finalizado com sucesso!",
    lastMessageTime: "11:00",
    createdAt: "2021-09-01T11:00:00.000Z"
  },
  {
    id: "3",
    name: "Carlos Ferreira",
    phone: "+55 11 93456-7890",
    email: "carlos.ferreira@example.com",
    company: "Empresa C",
    notes: "Aguardando aprovação do orçamento.",
    kanbanStageId: "3",
    tags: ["Aguardando"],
    assignedUser: "Maria Souza",
    lastMessage: "Ainda não recebi o orçamento.",
    lastMessageTime: "12:00",
    createdAt: "2021-09-01T12:00:00.000Z"
  },
  {
    id: "4",
    name: "Ana Paula",
    phone: "+55 11 94567-8901",
    email: "ana.paula@example.com",
    company: "Empresa D",
    notes: "Cancelou o contrato.",
    kanbanStageId: "4",
    tags: ["Cancelado"],
    assignedUser: "João Silva",
    lastMessage: "Não tenho mais interesse.",
    lastMessageTime: "13:00",
    createdAt: "2021-09-01T13:00:00.000Z"
  },
  {
    id: "5",
    name: "Ricardo Oliveira",
    phone: "+55 11 95678-9012",
    email: "ricardo.oliveira@example.com",
    company: "Empresa E",
    notes: "Cliente VIP, sempre indica novos clientes.",
    kanbanStageId: "1",
    tags: ["Importante", "Concluído"],
    assignedUser: "Maria Souza",
    lastMessage: "Indiquei um novo cliente para vocês.",
    lastMessageTime: "14:00",
    createdAt: "2021-09-01T14:00:00.000Z"
  },
  {
    id: "6",
    name: "Fernanda Lima",
    phone: "+55 11 96789-0123",
    email: "fernanda.lima@example.com",
    company: "Empresa F",
    notes: "Projeto em fase de testes.",
    kanbanStageId: "2",
    tags: ["Em Andamento"],
    assignedUser: "João Silva",
    lastMessage: "Estamos quase finalizando os testes.",
    lastMessageTime: "15:00",
    createdAt: "2021-09-01T15:00:00.000Z"
  },
  {
    id: "7",
    name: "Paulo Roberto",
    phone: "+55 11 97890-1234",
    email: "paulo.roberto@example.com",
    company: "Empresa G",
    notes: "Aguardando feedback do cliente.",
    kanbanStageId: "3",
    tags: ["Aguardando"],
    assignedUser: "Maria Souza",
    lastMessage: "Aguardando seu feedback.",
    lastMessageTime: "16:00",
    createdAt: "2021-09-01T16:00:00.000Z"
  },
  {
    id: "8",
    name: "Juliana Garcia",
    phone: "+55 11 98901-2345",
    email: "juliana.garcia@example.com",
    company: "Empresa H",
    notes: "Cancelou o serviço por falta de verba.",
    kanbanStageId: "4",
    tags: ["Cancelado"],
    assignedUser: "João Silva",
    lastMessage: "Infelizmente, não temos verba para continuar.",
    lastMessageTime: "17:00",
    createdAt: "2021-09-01T17:00:00.000Z"
  },
  {
    id: "9",
    name: "Lucas Mendes",
    phone: "+55 11 99012-3456",
    email: "lucas.mendes@example.com",
    company: "Empresa I",
    notes: "Cliente estratégico, grande potencial de crescimento.",
    kanbanStageId: "1",
    tags: ["Importante", "Em Andamento"],
    assignedUser: "Maria Souza",
    lastMessage: "Vamos marcar uma reunião para discutir o futuro.",
    lastMessageTime: "18:00",
    createdAt: "2021-09-01T18:00:00.000Z"
  },
  {
    id: "10",
    name: "Beatriz Costa",
    phone: "+55 11 90123-4567",
    email: "beatriz.costa@example.com",
    company: "Empresa J",
    notes: "Entregou tudo antes do prazo, cliente muito satisfeita.",
    kanbanStageId: "2",
    tags: ["Concluído"],
    assignedUser: "João Silva",
    lastMessage: "Adorei o resultado, muito obrigada!",
    lastMessageTime: "19:00",
    createdAt: "2021-09-01T19:00:00.000Z"
  }
];

export const unifiedTags: KanbanTag[] = [
  { id: "1", name: "VIP", color: "purple", kanbanStageId: "1" },
  { id: "2", name: "Urgente", color: "red", kanbanStageId: "1" },
  { id: "3", name: "Interessado", color: "blue", kanbanStageId: "2" },
  { id: "4", name: "Quente", color: "orange", kanbanStageId: "2" },
  { id: "5", name: "Negociando", color: "yellow", kanbanStageId: "3" },
  { id: "6", name: "Proposta Enviada", color: "cyan", kanbanStageId: "3" },
  { id: "7", name: "Cliente", color: "green", kanbanStageId: "4" },
  { id: "8", name: "Perdido", color: "gray", kanbanStageId: "5" },
  { id: "9", name: "Prospecção", color: "pink", kanbanStageId: "1" }
];

export const unifiedKanbanStages: KanbanStage[] = [
  { id: "1", title: "Leads", color: "blue", order: 1, isFixed: true },
  { id: "2", title: "Interessados", color: "orange", order: 2, isFixed: false },
  { id: "3", title: "Negociação", color: "yellow", order: 3, isFixed: false },
  { id: "4", title: "Vendas", color: "green", order: 4, isFixed: true, isWon: true },
  { id: "5", title: "Perdidos", color: "red", order: 5, isFixed: true, isLost: true }
];

export const unifiedContacts: Contact[] = [
  {
    id: "1",
    name: "Ana Silva",
    phone: "+55 11 99999-1234",
    email: "ana.silva@email.com",
    address: "Rua das Flores, 123, São Paulo - SP",
    company: "Tech Solutions",
    documentId: "123.456.789-01",
    tags: ["VIP", "Interessado"],
    notes: "Cliente em potencial para projeto de e-commerce. Demonstrou interesse em soluções personalizadas.",
    assignedUser: "João Santos",
    lastMessageTime: "10:30",
    lastMessage: "Estou interessada em saber mais sobre os preços",
    unreadCount: 3,
    avatar: "",
    createdAt: "2024-01-15T08:00:00Z",
    deals: [
      {
        id: "d1",
        status: "won",
        value: 15000,
        date: "2024-01-10",
        note: "Projeto de e-commerce concluído com sucesso"
      }
    ],
    isOnline: true
  },
  {
    id: "2", 
    name: "Carlos Mendes",
    phone: "+55 11 98888-5678",
    email: "carlos.mendes@empresa.com",
    address: "Av. Paulista, 456, São Paulo - SP",
    company: "Inovação Ltda",
    documentId: "987.654.321-09",
    tags: ["Urgente", "Negociando"],
    notes: "Urgência na implementação do sistema. Prazo apertado mas orçamento flexível.",
    assignedUser: "Maria Costa",
    lastMessageTime: "09:45",
    lastMessage: "Quando podemos agendar uma reunião?",
    unreadCount: 1,
    avatar: "",
    createdAt: "2024-01-16T09:00:00Z",
    deals: [],
    isOnline: false
  },
  {
    id: "3",
    name: "Mariana Almeida",
    phone: "+55 11 97777-4321",
    email: "mariana.almeida@corp.com",
    address: "Rua Augusta, 789, São Paulo - SP",
    company: "Global Solutions",
    documentId: "456.789.012-34",
    tags: ["Proposta Enviada"],
    notes: "Aguardando feedback sobre a proposta. Cliente com grande potencial de receita.",
    assignedUser: "Pedro Silva",
    lastMessageTime: "14:20",
    lastMessage: "A proposta foi enviada ontem. Alguma dúvida?",
    unreadCount: 0,
    avatar: "",
    createdAt: "2024-01-17T10:00:00Z",
    deals: [],
    isOnline: true
  },
  {
    id: "4",
    name: "Roberto Souza",
    phone: "+55 11 96666-9876",
    email: "roberto.souza@tech.br",
    address: "Av. Faria Lima, 1010, São Paulo - SP",
    company: "TechNow",
    documentId: "789.012.345-67",
    tags: ["Cliente"],
    notes: "Cliente fiel. Sempre renova os contratos e está aberto a novas soluções.",
    assignedUser: "Ana Oliveira",
    lastMessageTime: "16:55",
    lastMessage: "Tudo certo com a renovação do contrato.",
    unreadCount: 0,
    avatar: "",
    createdAt: "2024-01-18T11:00:00Z",
    deals: [
      {
        id: "d2",
        status: "won",
        value: 30000,
        date: "2024-01-15",
        note: "Renovação de contrato anual"
      }
    ],
    isOnline: false
  },
  {
    id: "5",
    name: "Juliana Costa",
    phone: "+55 11 95555-5432",
    email: "juliana.costa@consult.com",
    address: "Rua Haddock Lobo, 1515, São Paulo - SP",
    company: "Consulting Experts",
    documentId: "234.567.890-12",
    tags: ["Perdido"],
    notes: "Não mostrou interesse na proposta. Orçamento fora da realidade do cliente.",
    assignedUser: "João Santos",
    lastMessageTime: "11:11",
    lastMessage: "Agradecemos o contato, mas não temos interesse no momento.",
    unreadCount: 0,
    avatar: "",
    createdAt: "2024-01-19T12:00:00Z",
    deals: [],
    isOnline: true
  },
  {
    id: "6",
    name: "Ricardo Pereira",
    phone: "+55 11 94444-8765",
    email: "ricardo.pereira@sales.com",
    address: "Av. Brigadeiro Faria Lima, 2020, São Paulo - SP",
    company: "SalesUp",
    documentId: "567.890.123-45",
    tags: ["Prospecção"],
    notes: "Iniciando contato. Apresentar soluções de CRM e automação de vendas.",
    assignedUser: "Maria Costa",
    lastMessageTime: "17:30",
    lastMessage: "Olá, Ricardo! Podemos agendar uma breve apresentação?",
    unreadCount: 2,
    avatar: "",
    createdAt: "2024-01-20T13:00:00Z",
    deals: [],
    isOnline: false
  },
  {
    id: "7",
    name: "Fernanda Oliveira",
    phone: "+55 11 93333-2109",
    email: "fernanda.oliveira@market.com",
    address: "Rua Oscar Freire, 2525, São Paulo - SP",
    company: "MarketPlus",
    documentId: "890.123.456-78",
    tags: ["Negociando"],
    notes: "Em negociação avançada. Ajustar proposta para fechar o negócio.",
    assignedUser: "Pedro Silva",
    lastMessageTime: "08:00",
    lastMessage: "Podemos ajustar o preço para fecharmos o contrato?",
    unreadCount: 1,
    avatar: "",
    createdAt: "2024-01-21T14:00:00Z",
    deals: [],
    isOnline: true
  },
  {
    id: "8",
    name: "Paulo Santos",
    phone: "+55 11 92222-6543",
    email: "paulo.santos@digital.com",
    address: "Av. Rebouças, 3030, São Paulo - SP",
    company: "DigitalTech",
    documentId: "345.678.901-23",
    tags: ["Cliente"],
    notes: "Cliente satisfeito com os resultados. Avaliar novas oportunidades.",
    assignedUser: "Ana Oliveira",
    lastMessageTime: "19:45",
    lastMessage: "Os resultados da campanha foram excelentes!",
    unreadCount: 0,
    avatar: "",
    createdAt: "2024-01-22T15:00:00Z",
    deals: [
      {
        id: "d3",
        status: "won",
        value: 18000,
        date: "2024-01-20",
        note: "Campanha de marketing digital"
      }
    ],
    isOnline: false
  },
  {
    id: "9",
    name: "Camila Rodrigues",
    phone: "+55 11 91111-4321",
    email: "camila.rodrigues@soft.com",
    address: "Rua da Consolação, 3535, São Paulo - SP",
    company: "SoftSolutions",
    documentId: "678.901.234-56",
    tags: ["Proposta Enviada"],
    notes: "Aguardando aprovação da proposta. Cliente com interesse em soluções de software.",
    assignedUser: "João Santos",
    lastMessageTime: "13:30",
    lastMessage: "A proposta foi enviada. Aguardamos seu feedback.",
    unreadCount: 3,
    avatar: "",
    createdAt: "2024-01-23T16:00:00Z",
    deals: [],
    isOnline: true
  },
  {
    id: "10",
    name: "Thiago Almeida",
    phone: "+55 11 90000-9876",
    email: "thiago.almeida@cloud.com",
    address: "Av. Paulista, 4040, São Paulo - SP",
    company: "CloudServices",
    documentId: "901.234.567-89",
    tags: ["Perdido"],
    notes: "Cliente optou por outra solução. Não insistir no contato.",
    assignedUser: "Maria Costa",
    lastMessageTime: "09:15",
    lastMessage: "Optamos por outra solução. Agradecemos o contato.",
    unreadCount: 0,
    avatar: "",
    createdAt: "2024-01-24T17:00:00Z",
    deals: [],
    isOnline: false
  }
];

const generateFakeLeads = (count: number = 50): KanbanLead[] => {
  const stages = unifiedKanbanStages;
  const tags = unifiedTags;
  const users = ["João Santos", "Maria Costa", "Pedro Silva", "Ana Oliveira"];
  
  const firstNames = ["Ana", "Carlos", "Maria", "João", "Paula", "Roberto", "Juliana", "Ricardo", "Fernanda", "Marcos"];
  const lastNames = ["Silva", "Santos", "Oliveira", "Costa", "Ferreira", "Rodrigues", "Almeida", "Pereira", "Lima", "Gomes"];
  const companies = ["Tech Solutions", "Inovação Ltda", "Digital Corp", "StartUp XYZ", "Empresa ABC", "Negócios 360", "Soluções Tech", "Criativa LTDA"];

  return Array.from({ length: count }, (_, i) => {
    const randomStage = stages[Math.floor(Math.random() * stages.length)];
    const randomTags = tags
      .filter(() => Math.random() > 0.7)
      .slice(0, Math.floor(Math.random() * 3) + 1);
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];

    return {
      id: `lead-${i + 1}`,
      name: `${firstName} ${lastName}`,
      phone: `+55 11 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
      company,
      notes: `Anotações sobre ${firstName} ${lastName}. Cliente em potencial para nossos serviços.`,
      kanbanStageId: randomStage.id,
      tags: randomTags,
      assignedUser: randomUser,
      lastMessage: "Última mensagem do cliente...",
      lastMessageTime: `${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
};

export const unifiedLeads = generateFakeLeads();
