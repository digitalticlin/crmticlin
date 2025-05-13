
import { useState } from "react";
import { 
  Table, TableHeader, TableRow, TableHead, 
  TableBody, TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, RefreshCcw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
];

export default function WhatsAppPanel() {
  const [instances] = useState(mockWhatsAppInstances);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  
  const companies = [
    { id: '1', name: 'Tech Solutions Ltda' },
    { id: '2', name: 'Marketing Digital SA' },
    { id: '3', name: 'Comércio Eletrônico Brasil' },
    { id: '4', name: 'Agência de Viagens Turismo' },
    { id: '5', name: 'Consultoria Empresarial' },
  ];
  
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
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'connected':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Conectado
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" /> Desconectado
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" /> Erro
          </Badge>
        );
      case 'connecting':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <RefreshCcw className="h-3 w-3 mr-1 animate-spin" /> Conectando
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Instâncias WhatsApp</CardTitle>
              <CardDescription>
                Monitore todas as conexões WhatsApp integradas via Evolution API
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-1">
                <RefreshCcw className="h-4 w-4" /> Atualizar Status
              </Button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou empresa..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="connected">Conectados</SelectItem>
                  <SelectItem value="disconnected">Desconectados</SelectItem>
                  <SelectItem value="error">Com erro</SelectItem>
                  <SelectItem value="connecting">Conectando</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Instância</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Atividade</TableHead>
                  <TableHead>Mensagens 24h</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">{instance.name}</TableCell>
                    <TableCell>{instance.phone}</TableCell>
                    <TableCell className="font-mono text-xs">{instance.instanceName}</TableCell>
                    <TableCell>{instance.company}</TableCell>
                    <TableCell>{getStatusBadge(instance.status)}</TableCell>
                    <TableCell>{instance.lastActivity}</TableCell>
                    <TableCell>{instance.messages}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          Reconectar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          Logs
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredInstances.length} de {instances.length} instâncias
          </div>
          <div className="text-sm text-muted-foreground">
            Última verificação: 13/05/2024 16:30
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico do Sistema Evolution API</CardTitle>
          <CardDescription>
            Estado atual da integração com a Evolution API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                <span>API Server</span>
              </div>
              <span className="text-sm text-green-600">Operacional</span>
            </div>
            
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                <span>WebHook Receptor</span>
              </div>
              <span className="text-sm text-green-600">Operacional</span>
            </div>
            
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                <span>Processador de Mensagens</span>
              </div>
              <span className="text-sm text-green-600">Operacional</span>
            </div>
            
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                <span>Serviço de QR Code</span>
              </div>
              <span className="text-sm text-amber-600">Degradado (80% funcionando)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
