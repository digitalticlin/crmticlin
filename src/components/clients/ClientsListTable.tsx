
import { useState } from "react";
import { ClientData } from "@/hooks/clients/types";
import { Input } from "@/components/ui/input";
import { Search, Edit, Trash2, FileSpreadsheet, Phone, Mail, Building } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ClientsListTableProps {
  clients: ClientData[];
  onSelectClient: (client: ClientData) => void;
  onEditClient: (client: ClientData) => void;
  onDeleteClient: (clientId: string) => void;
  isLoading?: boolean;
}

export const ClientsListTable = ({ 
  clients, 
  onSelectClient, 
  onEditClient, 
  onDeleteClient,
  isLoading 
}: ClientsListTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Function to export clients to CSV
  const exportToCSV = () => {
    let csv = "Nome,Telefone,Email,Empresa,Valor,Data de Criação\n";
    
    filteredClients.forEach(client => {
      const createdDate = new Date(client.created_at).toLocaleDateString('pt-BR');
      const value = client.purchase_value ? `R$ ${client.purchase_value.toFixed(2)}` : '';
      
      csv += `"${client.name}","${formatPhoneDisplay(client.phone)}","${client.email || ''}","${client.company || ''}","${value}","${createdDate}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'lista-de-clientes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Lista de clientes exportada com sucesso");
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "-";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (client: ClientData) => {
    if (client.purchase_value && client.purchase_value > 0) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Cliente</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Lead</Badge>;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Search and Export Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 items-center flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone, email ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Total: <strong>{clients.length}</strong> clientes
          </span>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 rounded-xl"
            onClick={exportToCSV}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="font-semibold text-gray-900">Cliente</TableHead>
              <TableHead className="font-semibold text-gray-900">Contato</TableHead>
              <TableHead className="font-semibold text-gray-900">Empresa</TableHead>
              <TableHead className="font-semibold text-gray-900">Status</TableHead>
              <TableHead className="font-semibold text-gray-900">Valor</TableHead>
              <TableHead className="font-semibold text-gray-900">Criado em</TableHead>
              <TableHead className="w-24 font-semibold text-gray-900">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map(client => (
              <TableRow 
                key={client.id} 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onSelectClient(client)}
              >
                <TableCell>
                  <div className="font-medium text-gray-900">{client.name}</div>
                  {client.notes && (
                    <div className="text-sm text-gray-500 truncate max-w-[200px]">
                      {client.notes}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span>{formatPhoneDisplay(client.phone)}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span>{client.email}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {client.company ? (
                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">{client.company}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {getStatusBadge(client)}
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {formatCurrency(client.purchase_value)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {new Date(client.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClient(client);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o cliente "{client.name}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => onDeleteClient(client.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Nenhum cliente encontrado</p>
                      <p className="text-sm text-gray-500">
                        {searchQuery 
                          ? "Tente ajustar sua pesquisa ou adicione um novo cliente" 
                          : "Adicione seu primeiro cliente para começar"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
