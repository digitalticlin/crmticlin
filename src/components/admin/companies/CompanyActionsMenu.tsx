
import { Button } from "@/components/ui/button";
import { 
  Edit, Trash2, Ban, 
  CheckCircle2
} from "lucide-react";

interface CompanyActionsMenuProps {
  company: any;
  handleEdit: (company: any) => void;
  handleDelete: (company: any) => void;
}

export const CompanyActionsMenu = ({ 
  company, 
  handleEdit, 
  handleDelete 
}: CompanyActionsMenuProps) => {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
        <Edit className="h-4 w-4" />
      </Button>
      {company.status === 'active' ? (
        <Button variant="ghost" size="icon" className="text-amber-500">
          <Ban className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" className="text-green-500">
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(company)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
