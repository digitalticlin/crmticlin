
import { 
  Table, TableHeader, TableRow, TableHead, 
  TableBody, TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, RefreshCcw } from "lucide-react";

interface WhatsAppInstanceTableProps {
  filteredInstances: any[];
  getStatusBadge: (status: string) => React.ReactNode;
}

export const WhatsAppInstanceTable = ({ 
  filteredInstances,
  getStatusBadge 
}: WhatsAppInstanceTableProps) => {
  return (
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
  );
};
