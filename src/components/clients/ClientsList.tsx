
import { useState } from "react";
import { Contact } from "@/types/chat";
import { Input } from "@/components/ui/input";
import { Search, Edit, FileSpreadsheet } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ClientsListProps {
  clients: Contact[];
  onSelectClient: (client: Contact) => void;
}

export const ClientsList = ({ clients, onSelectClient }: ClientsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Function to export clients to CSV
  const exportToCSV = () => {
    // Create CSV header
    let csv = "Nome,Telefone,Email,Etapa do Funil\n";
    
    // Add data rows
    filteredClients.forEach(client => {
      let funnelStage = "Novo Lead";
      if (client.deals && client.deals.length > 0) {
        funnelStage = client.deals[0].status === "won" ? "Ganho" : "Em andamento";
      }
      
      csv += `"${client.name}","${client.phone}","${client.email || ''}","${funnelStage}"\n`;
    });
    
    // Create and download the file
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
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex justify-between items-center">
        <div className="flex gap-2 items-center flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome, telefone ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-3 ml-2">
          <span className="text-sm text-muted-foreground">
            Total: <strong>{clients.length}</strong> clientes
          </span>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
            onClick={exportToCSV}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Etapa do Funil</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map(client => (
              <TableRow 
                key={client.id} 
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>{client.email || "-"}</TableCell>
                <TableCell>
                  {client.deals && client.deals.length > 0 
                    ? client.deals[0].status === "won" 
                      ? "Ganho" 
                      : "Em andamento" 
                    : "Novo Lead"}
                </TableCell>
                <TableCell>
                  <div 
                    className="flex items-center justify-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClient(client);
                    }}
                  >
                    <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
