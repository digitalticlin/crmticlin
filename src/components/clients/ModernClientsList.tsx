
import { useState } from "react";
import { Contact } from "@/types/chat";
import { Input } from "@/components/ui/input";
import { Search, FileSpreadsheet, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ModernClientsListProps {
  clients: Contact[];
  onSelectClient: (client: Contact) => void;
}

export const ModernClientsList = ({ clients, onSelectClient }: ModernClientsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const exportToCSV = () => {
    let csv = "Nome,Telefone,Email,Etapa do Funil\n";
    
    filteredClients.forEach(client => {
      let funnelStage = "Novo Lead";
      if (client.deals && client.deals.length > 0) {
        funnelStage = client.deals[0].status === "won" ? "Ganho" : "Em andamento";
      }
      
      csv += `"${client.name}","${client.phone}","${client.email || ''}","${funnelStage}"\n`;
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getFunnelStage = (client: Contact) => {
    if (client.deals && client.deals.length > 0) {
      return client.deals[0].status === "won" ? "Ganho" : "Em andamento";
    }
    return "Novo Lead";
  };

  const getFunnelStageBadge = (stage: string) => {
    switch (stage) {
      case "Ganho":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ganho</Badge>;
      case "Em andamento":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Em andamento</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Novo Lead</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 items-center flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome, telefone ou email..."
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
            className="flex items-center gap-2"
            onClick={exportToCSV}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map(client => (
          <Card 
            key={client.id} 
            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
            onClick={() => onSelectClient(client)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{client.name}</h3>
                    {getFunnelStageBadge(getFunnelStage(client))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
                
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Tente ajustar sua pesquisa ou adicione um novo cliente" 
                    : "Adicione seu primeiro cliente para começar"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
