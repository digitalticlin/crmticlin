
import { Table, TableBody } from "@/components/ui/table";
import { CompanyTableHeader } from "./CompanyTableHeader";
import { CompanyTableRow } from "./CompanyTableRow";

interface CompanyTableProps {
  filteredCompanies: any[];
  getStatusBadge: (status: string) => React.ReactNode;
  handleEdit: (company: any) => void;
  handleDelete: (company: any) => void;
}

export const CompanyTable = ({ 
  filteredCompanies,
  getStatusBadge,
  handleEdit,
  handleDelete
}: CompanyTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <CompanyTableHeader />
        <TableBody>
          {filteredCompanies.map((company) => (
            <CompanyTableRow 
              key={company.id}
              company={company} 
              getStatusBadge={getStatusBadge}
              handleEdit={handleEdit} 
              handleDelete={handleDelete} 
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
