
import { 
  TableHeader, TableRow, TableHead 
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";

export const CompanyTableHeader = () => {
  return (
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
  );
};
