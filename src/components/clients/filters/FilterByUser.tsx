import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'lucide-react';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';

interface FilterByUserProps {
  users: { id: string; name: string }[];
  isLoading?: boolean;
}

export const FilterByUser = ({ users, isLoading }: FilterByUserProps) => {
  const { filters, addUserFilter, removeUserFilter } = useAdvancedFilters();

  const handleUserToggle = (userId: string, checked: boolean) => {
    if (checked) {
      addUserFilter(userId);
    } else {
      removeUserFilter(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Responsáveis</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Responsáveis</span>
        </div>
        <p className="text-xs text-gray-500">Nenhum usuário encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Responsáveis</span>
        {filters.responsibleUsers.length > 0 && (
          <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
            {filters.responsibleUsers.length}
          </Badge>
        )}
      </div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {users.map(user => (
          <div key={user.id} className="flex items-center space-x-2">
            <Checkbox
              id={`user-${user.id}`}
              checked={filters.responsibleUsers.includes(user.id)}
              onCheckedChange={(checked) => handleUserToggle(user.id, !!checked)}
            />
            <label
              htmlFor={`user-${user.id}`}
              className="text-sm cursor-pointer truncate"
              title={user.name}
            >
              {user.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};