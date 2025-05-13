
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CompanySearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export const CompanySearchBar = ({ searchTerm, setSearchTerm }: CompanySearchBarProps) => {
  return (
    <div className="relative mt-4">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar por nome, CNPJ ou email..."
        className="pl-10"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};
