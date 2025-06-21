
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  funnel_id?: string;
}

interface LeadsOutsideFunnelProps {
  leads?: Lead[];
  onMoveToFunnel?: (leadId: string, funnelId: string) => void;
}

export const LeadsOutsideFunnel = ({ 
  leads = [], 
  onMoveToFunnel 
}: LeadsOutsideFunnelProps) => {
  const leadsWithoutFunnel = leads.filter(lead => !lead.funnel_id);

  if (leadsWithoutFunnel.length === 0) {
    return null;
  }

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          Leads Fora do Funil
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leadsWithoutFunnel.slice(0, 5).map((lead) => (
            <div 
              key={lead.id}
              className="flex items-center justify-between p-2 bg-white rounded border"
            >
              <div>
                <p className="font-medium text-sm">{lead.name}</p>
                <p className="text-xs text-gray-600">{lead.phone}</p>
              </div>
              <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                Sem funil
              </Badge>
            </div>
          ))}
          
          {leadsWithoutFunnel.length > 5 && (
            <div className="text-sm text-gray-600 text-center mt-2">
              +{leadsWithoutFunnel.length - 5} mais leads fora do funil
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
