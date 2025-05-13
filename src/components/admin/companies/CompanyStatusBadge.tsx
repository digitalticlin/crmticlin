
import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (status: string) => {
  switch(status) {
    case 'active':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>;
    case 'suspended':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Suspenso</Badge>;
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
