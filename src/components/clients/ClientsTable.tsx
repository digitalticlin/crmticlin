
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";
import { ClientTableRow } from "./ClientTableRow";
import { ClientsCard } from "./ClientsCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface ClientsTableProps {
  filteredClients: ClientData[];
  searchQuery: string;
  onSelectClient: (client: ClientData) => void;
  onEditClient: (client: ClientData) => void;
  onDeleteClient: (clientId: string) => void;
}

export const ClientsTable = ({
  filteredClients,
  searchQuery,
  onSelectClient,
  onEditClient,
  onDeleteClient
}: ClientsTableProps) => {
  const isMobile = useIsMobile();

  // Mobile: Card View
  if (isMobile) {
    if (filteredClients.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <Search className="h-12 w-12 text-gray-400 mb-3" />
          <p className="font-medium text-gray-900 text-center mb-1">Nenhum cliente encontrado</p>
          <p className="text-sm text-gray-600 text-center">
            {searchQuery
              ? "Tente ajustar sua pesquisa ou adicione um novo cliente"
              : "Adicione seu primeiro cliente para começar"}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredClients.map(client => (
          <ClientsCard
            key={client.id}
            client={client}
            onSelectClient={onSelectClient}
            onEditClient={onEditClient}
            onDeleteClient={onDeleteClient}
          />
        ))}
      </div>
    );
  }

  // Desktop: Table View
  return (
    <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/30 bg-white/20">
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
            <ClientTableRow
              key={client.id}
              client={client}
              onSelectClient={onSelectClient}
              onEditClient={onEditClient}
              onDeleteClient={onDeleteClient}
            />
          ))}
          {filteredClients.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Nenhum cliente encontrado</p>
                    <p className="text-sm text-gray-600">
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
  );
};
