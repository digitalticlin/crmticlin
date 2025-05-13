
import { useState } from "react";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, RefreshCcw } from "lucide-react";
import { CompanyTable } from "./companies/CompanyTable";
import { CompanySearchBar } from "./companies/CompanySearchBar";
import { CompanyDialogs } from "./companies/CompanyDialogs";
import { getStatusBadge } from "./companies/CompanyStatusBadge";

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
          <CompanySearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
          />
        </CardHeader>
        <CardContent>
          <CompanyTable 
            filteredCompanies={filteredCompanies}
            getStatusBadge={getStatusBadge}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
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
      
      <CompanyDialogs 
        isAddDialogOpen={isAddDialogOpen}
        setIsAddDialogOpen={setIsAddDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        selectedCompany={selectedCompany}
        confirmDelete={confirmDelete}
      />
    </div>
  );
}
