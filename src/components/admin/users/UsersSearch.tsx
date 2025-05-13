
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UsersSearchProps {
  searchTerm: string;
  companyFilter: string;
  onSearchChange: (value: string) => void;
  onCompanyFilterChange: (value: string) => void;
  companies: { id: string; name: string }[];
}

const UsersSearch = ({
  searchTerm,
  companyFilter,
  onSearchChange,
  onCompanyFilterChange,
  companies
}: UsersSearchProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mt-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou empresa..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="w-full md:w-[250px]">
        <Select value={companyFilter} onValueChange={onCompanyFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {companies.map(company => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default UsersSearch;
