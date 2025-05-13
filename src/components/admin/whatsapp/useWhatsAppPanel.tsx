
import { useState } from "react";
import { WhatsAppInstance, SystemStatus } from "./types";

// Mock data for WhatsApp instances
const mockWhatsAppInstances = [
  { 
    id: '1', 
    name: 'Atendimento', 
    phone: '+5511912345678', 
    instanceName: 'tech_solutions_atendimento',
    company: 'Tech Solutions Ltda',
    companyId: '1',
    status: 'connected',
    lastActivity: '2024-05-13 15:45',
    messages: 143
  },
  { 
    id: '2', 
    name: 'Vendas', 
    phone: '+5511987654321', 
    instanceName: 'tech_solutions_vendas',
    company: 'Tech Solutions Ltda',
    companyId: '1',
    status: 'disconnected',
    lastActivity: '2024-05-12 10:30',
    messages: 78
  },
  { 
    id: '3', 
    name: 'Suporte', 
    phone: '+5511923456789', 
    instanceName: 'marketing_digital_suporte',
    company: 'Marketing Digital SA',
    companyId: '2',
    status: 'connected',
    lastActivity: '2024-05-13 16:10',
    messages: 229
  },
  { 
    id: '4', 
    name: 'Vendas', 
    phone: '+5511998765432', 
    instanceName: 'marketing_digital_vendas',
    company: 'Marketing Digital SA',
    companyId: '2',
    status: 'error',
    lastActivity: '2024-05-11 14:20',
    messages: 54
  },
  { 
    id: '5', 
    name: 'Atendimento', 
    phone: '+5511934567890', 
    instanceName: 'eletronicos_brasil',
    company: 'Comércio Eletrônico Brasil',
    companyId: '3',
    status: 'connecting',
    lastActivity: '2024-05-13 09:15',
    messages: 12
  }
] as WhatsAppInstance[];

const companies = [
  { id: '1', name: 'Tech Solutions Ltda' },
  { id: '2', name: 'Marketing Digital SA' },
  { id: '3', name: 'Comércio Eletrônico Brasil' },
  { id: '4', name: 'Agência de Viagens Turismo' },
  { id: '5', name: 'Consultoria Empresarial' },
];

const systemStatuses: SystemStatus[] = [
  {
    name: "API Server",
    status: "operational"
  },
  {
    name: "WebHook Receptor",
    status: "operational"
  },
  {
    name: "Processador de Mensagens",
    status: "operational"
  },
  {
    name: "Serviço de QR Code",
    status: "degraded",
    details: "80% funcionando"
  }
];

export const useWhatsAppPanel = () => {
  const [instances] = useState(mockWhatsAppInstances);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  const filteredInstances = instances.filter(instance => {
    const matchesSearch = 
      instance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.phone.includes(searchTerm) ||
      instance.instanceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || instance.status === statusFilter;
    const matchesCompany = companyFilter === 'all' || instance.companyId === companyFilter;
    
    return matchesSearch && matchesStatus && matchesCompany;
  });

  return {
    instances,
    filteredInstances,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    companyFilter,
    setCompanyFilter,
    companies,
    systemStatuses
  };
};
