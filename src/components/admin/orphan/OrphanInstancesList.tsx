
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, Phone, User } from "lucide-react";

interface VPSInstance {
  instanceId: string;
  status: string;
  phone?: string;
  profileName?: string;
  profilePictureUrl?: string;
  isOrphan: boolean;
  companyName?: string;
  userName?: string;
  lastSeen?: string;
  companyId?: string;
  userId?: string;
}

interface OrphanInstancesListProps {
  filteredOrphans: VPSInstance[];
  orphanInstances: VPSInstance[];
  isLoading: boolean;
  isProcessing: boolean;
  onBindInstance: (instanceId: string) => void;
}

export const OrphanInstancesList = ({
  filteredOrphans,
  orphanInstances,
  isLoading,
  isProcessing,
  onBindInstance
}: OrphanInstancesListProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Escaneando instâncias na VPS...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredOrphans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Instâncias Órfãs Encontradas</CardTitle>
          <p className="text-sm text-gray-600">
            {filteredOrphans.length} de {orphanInstances.length} órfãs
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {orphanInstances.length === 0 ? 'Nenhuma instância órfã encontrada!' : 'Nenhuma órfã corresponde à busca'}
            </h3>
            <p className="text-gray-600">
              {orphanInstances.length === 0 
                ? 'Todas as instâncias da VPS estão devidamente vinculadas no Supabase.'
                : 'Tente ajustar os filtros de busca.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instâncias Órfãs Encontradas</CardTitle>
        <p className="text-sm text-gray-600">
          {filteredOrphans.length} de {orphanInstances.length} órfãs
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredOrphans.map((orphan) => (
            <div 
              key={orphan.instanceId} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  orphan.status === 'open' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                
                <div>
                  <p className="font-medium font-mono text-sm">{orphan.instanceId}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {orphan.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {orphan.phone}
                      </span>
                    )}
                    {orphan.profileName && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {orphan.profileName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant={orphan.status === 'open' ? "default" : "secondary"}>
                  {orphan.status === 'open' ? 'Ativo' : 'Inativo'}
                </Badge>
                
                {orphan.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onBindInstance(orphan.instanceId)}
                    disabled={isProcessing}
                    className="gap-1"
                  >
                    <User className="h-3 w-3" />
                    Vincular
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
