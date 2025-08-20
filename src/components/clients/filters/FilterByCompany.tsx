import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Building } from 'lucide-react';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';

interface FilterByCompanyProps {
  companies: string[];
  isLoading?: boolean;
}

export const FilterByCompany = ({ companies, isLoading }: FilterByCompanyProps) => {
  const { filters, updateFilter } = useAdvancedFilters();

  const handleCompanyToggle = (company: string, checked: boolean) => {
    const currentCompanies = filters.companies || [];
    if (checked) {
      updateFilter('companies', [...currentCompanies, company]);
    } else {
      updateFilter('companies', currentCompanies.filter(c => c !== company));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Empresa</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Empresa</span>
        </div>
        <p className="text-xs text-gray-500">Nenhuma empresa encontrada</p>
      </div>
    );
  }

  const selectedCompanies = filters.companies || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Empresa</span>
        {selectedCompanies.length > 0 && (
          <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
            {selectedCompanies.length}
          </Badge>
        )}
      </div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {companies.map(company => (
          <div key={company} className="flex items-center space-x-2">
            <Checkbox
              id={`company-${company}`}
              checked={selectedCompanies.includes(company)}
              onCheckedChange={(checked) => handleCompanyToggle(company, !!checked)}
            />
            <label
              htmlFor={`company-${company}`}
              className="text-sm cursor-pointer truncate"
              title={company}
            >
              {company}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};