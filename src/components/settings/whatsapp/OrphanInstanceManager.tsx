
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useOrphanRecovery } from '@/hooks/whatsapp/useOrphanRecovery';
import { OrphanInstance } from '@/services/whatsapp/orphan';
import { 
  Search, 
  RefreshCw, 
  Heart, 
  AlertTriangle,
  CheckCircle,
  Phone,
  User,
  Building
} from 'lucide-react';

interface OrphanInstanceCardProps {
  orphan: OrphanInstance;
  onAdopt: (orphan: OrphanInstance, instanceName: string) => Promise<void>;
  isAdopting: boolean;
}

const OrphanInstanceCard = ({ orphan, onAdopt, isAdopting }: OrphanInstanceCardProps) => {
  const [instanceName, setInstanceName] = useState('');
  const [isAdoptingThis, setIsAdoptingThis] = useState(false);

  const handleAdopt = async () => {
    if (!instanceName.trim()) return;
    
    setIsAdoptingThis(true);
    try {
      await onAdopt(orphan, instanceName);
      setInstanceName('');
    } finally {
      setIsAdoptingThis(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'connecting': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            Instância Órfã
          </CardTitle>
          <Badge className={getStatusColor(orphan.status)}>
            {orphan.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informações da instância */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">ID:</span>
            <code className="text-xs bg-gray-100 px-1 rounded">
              {orphan.instanceId}
            </code>
          </div>
          
          {orphan.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              <span>{orphan.phone}</span>
            </div>
          )}
          
          {orphan.profileName && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span>{orphan.profileName}</span>
            </div>
          )}
          
          {orphan.companyName && (
            <div className="flex items-center gap-2">
              <Building className="h-3 w-3" />
              <span>{orphan.companyName}</span>
            </div>
          )}
        </div>

        {/* Formulário de adoção */}
        <div className="space-y-2">
          <Input
            placeholder="Nome da instância..."
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            disabled={isAdopting || isAdoptingThis}
          />
          
          <Button
            onClick={handleAdopt}
            disabled={!instanceName.trim() || isAdopting || isAdoptingThis}
            className="w-full bg-green-600 hover:bg-green-700"
            size="sm"
          >
            {isAdoptingThis ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Adotando...
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Adotar Instância
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const OrphanInstanceManager = () => {
  const {
    orphans,
    isScanning,
    isAdopting,
    healthCheck,
    scanForOrphans,
    adoptOrphan,
    performHealthCheck
  } = useOrphanRecovery();

  // Wrapper para compatibilizar o tipo de retorno
  const handleAdoptOrphan = async (orphan: OrphanInstance, instanceName: string): Promise<void> => {
    await adoptOrphan(orphan, instanceName);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Recuperação de Instâncias
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={scanForOrphans}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Escaneando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Escanear Órfãs
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={performHealthCheck}
              disabled={isScanning}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Health Check
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Resumo do Health Check */}
        {healthCheck && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Resumo do Health Check</h4>
            <div className="text-sm space-y-1">
              <p>• {orphans.length} instância(s) órfã(s)</p>
              <p>• {healthCheck.inconsistencies?.length || 0} inconsistência(s)</p>
              {healthCheck.recommendations?.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Recomendações:</p>
                  <ul className="list-disc list-inside">
                    {healthCheck.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista de órfãs */}
        {orphans.length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-medium text-orange-800">
              {orphans.length} instância(s) órfã(s) encontrada(s):
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              {orphans.map((orphan) => (
                <OrphanInstanceCard
                  key={orphan.instanceId}
                  orphan={orphan}
                  onAdopt={handleAdoptOrphan}
                  isAdopting={isAdopting}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma instância órfã encontrada</p>
            <p className="text-sm">Clique em "Escanear Órfãs" para verificar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
