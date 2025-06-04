
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useGlobalVPSInstances } from '@/hooks/admin/useGlobalVPSInstances';
import { VPSInstanceCard } from './VPSInstanceCard';
import { VPSInstancesSummary } from './VPSInstancesSummary';
import { 
  Search, 
  RefreshCw, 
  Filter,
  Trash2,
  Zap,
  Settings
} from 'lucide-react';

export const VPSInstancesPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const {
    instances,
    isLoading,
    lastUpdate,
    autoRefresh,
    refreshInstances,
    toggleAutoRefresh,
    cleanupOrphans,
    massReconnect
  } = useGlobalVPSInstances();

  // Filtrar instâncias
  const filteredInstances = instances.filter(instance => {
    const matchesSearch = 
      instance.instanceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.profileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && instance.status === 'open') ||
      (statusFilter === 'inactive' && instance.status !== 'open') ||
      (statusFilter === 'orphan' && instance.isOrphan);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Painel de Resumo */}
      <VPSInstancesSummary instances={instances} />
      
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Controles de Monitoramento
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={autoRefresh ? "default" : "secondary"}>
                {autoRefresh ? "Auto-refresh ativo" : "Auto-refresh inativo"}
              </Badge>
              {lastUpdate && (
                <span className="text-sm text-muted-foreground">
                  Última atualização: {new Date(lastUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, telefone, usuário ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Ativas
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
              >
                Inativas
              </Button>
              <Button
                variant={statusFilter === 'orphan' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('orphan')}
              >
                Órfãs
              </Button>
            </div>
            
            {/* Ações */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshInstances}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutoRefresh}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={massReconnect}
                disabled={isLoading}
              >
                <Zap className="h-4 w-4" />
                Reconectar
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={cleanupOrphans}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
                Limpar Órfãs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contador de Resultados */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Mostrando {filteredInstances.length} de {instances.length} instâncias
        </span>
      </div>

      {/* Grid de Instâncias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInstances.map((instance) => (
          <VPSInstanceCard
            key={instance.instanceId}
            instance={instance}
            onRefresh={refreshInstances}
          />
        ))}
      </div>

      {/* Estado vazio */}
      {filteredInstances.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhuma instância encontrada com os filtros aplicados.'
                : 'Nenhuma instância encontrada na VPS.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
