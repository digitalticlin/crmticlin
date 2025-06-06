
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Phone, Mail, Building } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { ClientDeleteDialog } from "./ClientDeleteDialog";

interface ClientTableRowProps {
  client: ClientData;
  onSelectClient: (client: ClientData) => void;
  onEditClient: (client: ClientData) => void;
  onDeleteClient: (clientId: string) => void;
}

export const ClientTableRow = ({ 
  client, 
  onSelectClient, 
  onEditClient, 
  onDeleteClient 
}: ClientTableRowProps) => {
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

  return (
    <TableRow 
      className="cursor-pointer hover:bg-white/20 transition-all duration-200 border-b border-white/20"
      onClick={() => onSelectClient(client)}
    >
      <TableCell>
        <div className="font-medium text-gray-900">{client.name}</div>
        {client.notes && (
          <div className="text-sm text-gray-600 truncate max-w-[200px]">
            {client.notes}
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3 w-3 text-black" />
            <span className="text-gray-800">{formatPhoneDisplay(client.phone)}</span>
          </div>
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="h-3 w-3 text-black" />
              <span>{client.email}</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {client.company ? (
          <div className="flex items-center gap-2">
            <Building className="h-3 w-3 text-black" />
            <span className="text-sm text-gray-800">{client.company}</span>
          </div>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </TableCell>
      <TableCell>
        {getStatusBadge(client)}
      </TableCell>
      <TableCell>
        <span className="font-medium text-gray-800">
          {formatCurrency(client.purchase_value)}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-700">
          {new Date(client.created_at).toLocaleDateString('pt-BR')}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-black hover:text-gray-700 hover:bg-gray-100/50"
            onClick={(e) => {
              e.stopPropagation();
              onEditClient(client);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <ClientDeleteDialog 
            client={client}
            onDeleteClient={onDeleteClient}
          />
        </div>
      </TableCell>
    </TableRow>
  );
};
