
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Trash2, 
  Download, 
  Eye,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Phone,
  User,
  Building
} from "lucide-react";
import { useGlobalVPSInstances } from "@/hooks/admin/useGlobalVPSInstances";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const OrphanInstanceManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    instances,
    isLoading,
    refreshInstances,
    cleanupOrphans
  } = useGlobalVPSInstances();

  // Filtrar apenas instâncias órfãs
  const orphanInstances = instances.filter(instance => instance.isOrphan);
  
  // Aplicar filtro de busca
  const filteredOrphans = orphanInstances.filter(instance => 
    instance.instanceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instance.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instance.profileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sincronizar instâncias órfãs que têm telefone
  const handleSyncOrphans = async () => {
    if (!confirm('Sincronizar todas as instâncias órfãs que possuem telefone ativo?')) {
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { action: 'sync_orphan_instances' }
      });

      if (error) {
        toast.error('Erro ao sincronizar órfãs');
        return;
      }

      if (data.success) {
        toast.success(`${data.syncedOrphans || 0} instâncias órfãs sincronizadas`);
        await refreshInstances();
      } else {
        toast.error('Falha na sincronização: ' + data.error);
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar órfãs:', error);
      toast.error('Erro inesperado na sincronização');
    } finally {
      setIsProcessing(false);
    }
  };

  // Vincular instância órfã a um usuário específico
  const handleBindInstance = async (instanceId: string) => {
    const userEmail = prompt('Digite o email do usuário para vincular esta instância:');
    if (!userEmail) return;

    const instanceName = prompt('Digite um nome para esta instância:') || `instance_${instanceId.slice(-8)}`;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { 
          action: 'bind_instance_to_user',
          instanceId,
          userEmail,
          instanceName
        }
      });

      if (error) {
        toast.error('Erro ao vincular instância');
        return;
      }

      if (data.success) {
        toast.success(`Instância vinculada ao usuário ${userEmail}`);
        await refreshInstances();
      } else {
        toast.error('Falha na vinculação: ' + data.error);
      }
    } catch (error: any) {
      console.error('Erro ao vincular instância:', error);
      toast.error('Erro inesperado na vinculação');
    } finally {
      setIsProcessing(false);
    }
  };

  const orphansWithPhone = orphanInstances.filter(i => i.phone && i.phone.length > 0);
  const orphansWithoutPhone = orphanInstances.filter(i => !i.phone || i.phone.length === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800">
                  Gerenciador de Instâncias Órfãs
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Instâncias ativas na VPS mas não vinculadas no Supabase
                </p>
              </div>
            </div>
            <Button 
              onClick={refreshInstances}
              disabled={isLoading}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Escanear
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {orphanInstances.length}
                </p>
                <p className="text-sm text-gray-600">Total Órfãs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {orphansWithPhone.length}
                </p>
                <p className="text-sm text-gray-600">Com Telefone</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <WifiOff className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">
                  {orphansWithoutPhone.length}
                </p>
                <p className="text-sm text-gray-600">Sem Telefone</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Controles de Gerenciamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <Label htmlFor="search">Buscar instâncias órfãs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ID da instância, telefone, nome do perfil..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Ações */}
            <div className="flex gap-2">
              <Button
                onClick={handleSyncOrphans}
                disabled={isProcessing || orphansWithPhone.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Sincronizar com Telefone ({orphansWithPhone.length})
              </Button>
              
              <Button
                variant="destructive"
                onClick={cleanupOrphans}
                disabled={isProcessing || orphanInstances.length === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Órfãs ({orphanInstances.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de órfãs */}
      <Card>
        <CardHeader>
          <CardTitle>Instâncias Órfãs Encontradas</CardTitle>
          <p className="text-sm text-gray-600">
            {filteredOrphans.length} de {orphanInstances.length} órfãs
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Escaneando instâncias na VPS...</p>
            </div>
          ) : filteredOrphans.length === 0 ? (
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
          ) : (
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
                        onClick={() => handleBindInstance(orphan.instanceId)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
