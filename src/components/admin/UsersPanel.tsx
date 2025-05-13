
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
import { 
  Search, ArrowUpDown, 
  Download, 
  ChevronDown,
  UserCog,
  UserX
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for users
const mockUsers = [
  { 
    id: '1', 
    name: 'João Silva', 
    email: 'joao@techsolutions.com', 
    company: 'Tech Solutions Ltda',
    companyId: '1',
    role: 'Admin',
    lastLogin: '2024-05-10 10:23',
    status: 'online'
  },
  { 
    id: '2', 
    name: 'Maria Oliveira', 
    email: 'maria@techsolutions.com', 
    company: 'Tech Solutions Ltda',
    companyId: '1',
    role: 'Vendedor',
    lastLogin: '2024-05-09 14:45',
    status: 'offline'
  },
  { 
    id: '3', 
    name: 'Carlos Santos', 
    email: 'carlos@marketingdigital.com', 
    company: 'Marketing Digital SA',
    companyId: '2',
    role: 'Admin',
    lastLogin: '2024-05-13 08:15',
    status: 'online'
  },
  { 
    id: '4', 
    name: 'Ana Pereira', 
    email: 'ana@marketingdigital.com', 
    company: 'Marketing Digital SA',
    companyId: '2',
    role: 'Vendedor',
    lastLogin: '2024-05-12 16:30',
    status: 'offline'
  },
  { 
    id: '5', 
    name: 'Ricardo Gomes', 
    email: 'ricardo@eletronicosbrasil.com', 
    company: 'Comércio Eletrônico Brasil',
    companyId: '3',
    role: 'Admin',
    lastLogin: '2024-05-11 09:20',
    status: 'offline'
  },
];

export default function UsersPanel() {
  const [users] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  
  const companies = [
    { id: '1', name: 'Tech Solutions Ltda' },
    { id: '2', name: 'Marketing Digital SA' },
    { id: '3', name: 'Comércio Eletrônico Brasil' },
    { id: '4', name: 'Agência de Viagens Turismo' },
    { id: '5', name: 'Consultoria Empresarial' },
  ];
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = companyFilter === 'all' || user.companyId === companyFilter;
    
    return matchesSearch && matchesCompany;
  });
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'online':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Online</Badge>;
      case 'offline':
        return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">Offline</Badge>;
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
              <CardTitle>Usuários do Sistema</CardTitle>
              <CardDescription>
                Gerencie todos os usuários cadastrados na plataforma
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-1" /> Exportar Lista
              </Button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou empresa..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-[250px]">
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger>
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
                  <TableHead>
                    Nome <ArrowUpDown className="ml-1 h-4 w-4 inline-block" />
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>
                    Empresa <ChevronDown className="ml-1 h-4 w-4 inline-block" />
                  </TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.company}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="text-amber-500">
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500">
                          <UserX className="h-4 w-4" />
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
            Mostrando {filteredUsers.length} de {users.length} usuários
          </div>
          <div className="text-sm text-muted-foreground">
            Última atualização: 13/05/2024 16:45
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
