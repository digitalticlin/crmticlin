
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
  Plus, Search, Edit, Trash2, Ban, 
  CheckCircle2, RefreshCcw, ArrowUpDown, 
  Download
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import CompanyForm from "./CompanyForm";

// Mock data for companies
const mockCompanies = [
  { 
    id: '1', 
    name: 'Tech Solutions Ltda', 
    cnpj: '12.345.678/0001-90', 
    email: 'admin@techsolutions.com', 
    plan: 'Business', 
    status: 'active',
    users: 12,
    whatsapp: 5,
    createdAt: '2023-10-15'
  },
  { 
    id: '2', 
    name: 'Marketing Digital SA', 
    cnpj: '98.765.432/0001-21', 
    email: 'contato@marketingdigital.com', 
    plan: 'Pro', 
    status: 'active',
    users: 7,
    whatsapp: 3,
    createdAt: '2023-11-22'
  },
  { 
    id: '3', 
    name: 'Comércio Eletrônico Brasil', 
    cnpj: '45.678.901/0001-23', 
    email: 'suporte@eletronicosbrasil.com', 
    plan: 'Starter', 
    status: 'suspended',
    users: 3,
    whatsapp: 1,
    createdAt: '2024-01-10'
  },
  { 
    id: '4', 
    name: 'Agência de Viagens Turismo', 
    cnpj: '34.567.890/0001-45', 
    email: 'reservas@agenciaturismo.com', 
    plan: 'Pro', 
    status: 'pending',
    users: 5,
    whatsapp: 2,
    createdAt: '2024-02-28'
  },
  { 
    id: '5', 
    name: 'Consultoria Empresarial', 
    cnpj: '56.789.012/0001-67', 
    email: 'contato@consultoria.com', 
    plan: 'Business', 
    status: 'active',
    users: 15,
    whatsapp: 8,
    createdAt: '2023-09-05'
  }
];

export default function CompaniesPanel() {
  const [companies, setCompanies] = useState(mockCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.includes(searchTerm)
  );
  
  const handleEdit = (company: any) => {
    setSelectedCompany(company);
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (company: any) => {
    setSelectedCompany(company);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    setCompanies(companies.filter(c => c.id !== selectedCompany.id));
    setIsDeleteDialogOpen(false);
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Suspenso</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
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
              <CardTitle>Empresas Cadastradas</CardTitle>
              <CardDescription>
                Gerencie todas as empresas clientes da plataforma
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-[#d3d800] hover:bg-[#b8bc00]">
                <Plus className="h-4 w-4 mr-1" /> Nova Empresa
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-1" /> Exportar
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome <ArrowUpDown className="ml-1 h-4 w-4 inline-block" /></TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Email Admin</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.cnpj}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{company.plan}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(company.status)}</TableCell>
                    <TableCell>{company.users}</TableCell>
                    <TableCell>{company.whatsapp}</TableCell>
                    <TableCell>{company.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {company.status === 'active' ? (
                          <Button variant="ghost" size="icon" className="text-amber-500">
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="text-green-500">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(company)}>
                          <Trash2 className="h-4 w-4" />
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
            Mostrando {filteredCompanies.length} de {companies.length} empresas
          </div>
          <Button variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
        </CardFooter>
      </Card>
      
      {/* Add Company Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Empresa</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar uma nova empresa cliente na plataforma.
            </DialogDescription>
          </DialogHeader>
          <CompanyForm onSubmit={() => setIsAddDialogOpen(false)} />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" form="company-form" className="bg-[#d3d800] hover:bg-[#b8bc00]">Salvar Empresa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Atualize os dados da empresa selecionada.
            </DialogDescription>
          </DialogHeader>
          <CompanyForm company={selectedCompany} onSubmit={() => setIsEditDialogOpen(false)} />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" form="company-form" className="bg-[#d3d800] hover:bg-[#b8bc00]">Atualizar Empresa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Company Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a empresa {selectedCompany?.name}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir Empresa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
