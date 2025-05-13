
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CompanyActionsMenu } from "./CompanyActionsMenu";

interface CompanyTableRowProps {
  company: any;
  getStatusBadge: (status: string) => React.ReactNode;
  handleEdit: (company: any) => void;
  handleDelete: (company: any) => void;
}

export const CompanyTableRow = ({ 
  company, 
  getStatusBadge,
  handleEdit, 
  handleDelete 
}: CompanyTableRowProps) => {
  return (
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
        <CompanyActionsMenu 
          company={company} 
          handleEdit={handleEdit} 
          handleDelete={handleDelete} 
        />
      </TableCell>
    </TableRow>
  );
};
