
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
}

interface LeadsPreviewProps {
  leads: Lead[];
  totalCount: number;
  isLoading?: boolean;
}

export const LeadsPreview: React.FC<LeadsPreviewProps> = ({
  leads,
  totalCount,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Carregando destinatários...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Destinatários ({totalCount})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length > 0 ? (
          <div className="space-y-2">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex justify-between items-center text-sm">
                <span>{lead.name}</span>
                <span className="text-muted-foreground">{lead.phone}</span>
              </div>
            ))}
            {totalCount > 5 && (
              <div className="text-sm text-muted-foreground pt-2 border-t">
                E mais {totalCount - 5} destinatários...
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Nenhum destinatário encontrado com os critérios selecionados.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
