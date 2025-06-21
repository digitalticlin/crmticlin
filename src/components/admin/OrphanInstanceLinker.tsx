
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Link, Users, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrphanInstance {
  id: string;
  instance_name: string;
  phone?: string;
  connection_status: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
}

export const OrphanInstanceLinker = () => {
  const [orphanInstances, setOrphanInstances] = useState<OrphanInstance[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar instâncias órfãs
      const { data: orphans, error: orphansError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .is('created_by_user_id', null);

      if (orphansError) throw orphansError;

      // Buscar usuários disponíveis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'admin');

      if (profilesError) throw profilesError;

      setOrphanInstances(orphans || []);
      setUsers(profiles || []);
      
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkInstance = async (instanceId: string) => {
    const selectedUserId = selectedUsers[instanceId];
    
    if (!selectedUserId) {
      toast.error('Selecione um usuário para vincular');
      return;
    }

    try {
      setIsLinking(instanceId);
      
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ created_by_user_id: selectedUserId })
        .eq('id', instanceId);

      if (error) throw error;

      toast.success('Instância vinculada com sucesso');
      await fetchData();
      
    } catch (error) {
      console.error('Erro ao vincular instância:', error);
      toast.error('Erro ao vincular instância');
    } finally {
      setIsLinking(null);
    }
  };

  const handleBulkLink = async () => {
    const linksToProcess = Object.entries(selectedUsers).filter(([_, userId]) => userId);
    
    if (linksToProcess.length === 0) {
      toast.error('Selecione pelo menos uma instância para vincular');
      return;
    }

    try {
      setIsLinking('bulk');
      
      const promises = linksToProcess.map(([instanceId, userId]) =>
        supabase
          .from('whatsapp_instances')
          .update({ created_by_user_id: userId })
          .eq('id', instanceId)
      );

      await Promise.all(promises);
      
      toast.success(`${linksToProcess.length} instância(s) vinculada(s) com sucesso`);
      await fetchData();
      setSelectedUsers({});
      
    } catch (error) {
      console.error('Erro no vínculo em lote:', error);
      toast.error('Erro ao vincular instâncias em lote');
    } finally {
      setIsLinking(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Vincular Instâncias Órfãs
          <Badge variant="outline" className="ml-2">
            {orphanInstances.length} órfã(s)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orphanInstances.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma instância órfã encontrada
            </h3>
            <p className="text-gray-600">
              Todas as instâncias estão devidamente vinculadas aos seus proprietários
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Atenção</span>
              </div>
              <p className="text-orange-700 text-sm">
                {orphanInstances.length} instância(s) órfã(s) detectada(s). 
                Vincule-as aos proprietários corretos para garantir a segurança dos dados.
              </p>
            </div>

            <div className="space-y-4">
              {orphanInstances.map((instance) => (
                <div key={instance.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{instance.instance_name}</h3>
                      <div className="text-sm text-gray-600">
                        {instance.phone && <span>📱 {instance.phone}</span>}
                        <span className="ml-2">
                          Criada em {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={instance.connection_status === 'connected' ? 'default' : 'secondary'}
                    >
                      {instance.connection_status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <Select 
                      value={selectedUsers[instance.id] || ""} 
                      onValueChange={(value) => 
                        setSelectedUsers(prev => ({ ...prev, [instance.id]: value }))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um proprietário..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {user.full_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => handleLinkInstance(instance.id)}
                      disabled={!selectedUsers[instance.id] || isLinking === instance.id}
                      size="sm"
                    >
                      {isLinking === instance.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Link className="h-4 w-4 mr-2" />
                      )}
                      Vincular
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(selectedUsers).filter(key => selectedUsers[key]).length > 0 && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleBulkLink}
                  disabled={isLinking === 'bulk'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLinking === 'bulk' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  Vincular Todas Selecionadas
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
