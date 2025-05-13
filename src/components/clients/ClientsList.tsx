
import { useState } from "react";
import { Contact } from "@/types/chat";
import { KanbanTag } from "@/types/kanban";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { TagBadge } from "@/components/sales/tags/TagBadge";

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
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex gap-2 items-center">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente por nome, telefone ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>
      
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Valor de Compra</TableHead>
              <TableHead>Responsável</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map(client => (
              <TableRow 
                key={client.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSelectClient(client)}
              >
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>{client.email || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {client.tags ? client.tags.map(tag => (
                      <TagBadge 
                        key={tag} 
                        tag={{ id: tag, name: tag, color: "bg-blue-100" }} 
                      />
                    )) : "-"}
                  </div>
                </TableCell>
                <TableCell>
                  {client.purchaseValue ? formatCurrency(client.purchaseValue) : "-"}
                </TableCell>
                <TableCell>{client.assignedUser || "-"}</TableCell>
              </TableRow>
            ))}
            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
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
