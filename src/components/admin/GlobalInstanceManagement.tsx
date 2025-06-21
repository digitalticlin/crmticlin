
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  RefreshCw, 
  Search, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  MessageSquare,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  phone?: string;
  connection_status: string;
  created_by_user_id?: string;
  created_at: string;
  profile_name?: string;
}

export const GlobalInstanceManagement = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [filteredInstances, setFilteredInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchInstances();
  }, []);

  useEffect(() => {
    const filtered = instances.filter(instance =>
      instance.instance_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.profile_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInstances(filtered);
  }, [instances, searchTerm]);

  const fetchInstances = async () => {
    try {
      setIsLoading(true);
      
      const { data: instancesData, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInstances(instancesData || []);
      
      // Buscar perfis dos usuários para exibir informações completas
      if (instancesData && instancesData.length > 0) {
        const userIds = [...new Set(instancesData.map(i => i.created_by_user_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          if (profiles) {
            const profileMap = profiles.reduce((acc, profile) => {
              acc[profile.id] = profile;
              return acc;
            }, {} as Record<string, any>);
            setUserProfiles(profileMap);
          }
        }
      }
      
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
      toast.error('Erro ao carregar instâncias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInstance = async (instanceId: string, instanceName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a instância "${instanceName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;

      toast.success(`Instância "${instanceName}" deletada com sucesso`);
      await fetchInstances();
      
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      toast.error('Erro ao deletar instância');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'connected' || status === 'ready') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Conectada</Badge>;
    } else if (status === 'disconnected') {
      return <Badge variant="secondary">Desconectada</Badge>;
    } else if (status === 'error') {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Erro</Badge>;
    } else {
      return <Badge variant="outline">{status}</Badge>;
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Gerenciamento Global de Instâncias
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {instances.length} instância(s)
              </Badge>
              <Button onClick={fetchInstances} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, telefone ou perfil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredInstances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Nenhuma instância encontrada com os filtros aplicados' : 'Nenhuma instância encontrada'}
              </div>
            ) : (
              filteredInstances.map((instance) => (
                <div key={instance.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                      <div>
                        <h3 className="font-medium">{instance.instance_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {instance.phone && <span>📱 {instance.phone}</span>}
                          {instance.profile_name && <span>👤 {instance.profile_name}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(instance.connection_status)}
                      <Button
                        onClick={() => handleDeleteInstance(instance.id, instance.instance_name)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Proprietário:</span>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="h-3 w-3" />
                        {instance.created_by_user_id 
                          ? userProfiles[instance.created_by_user_id]?.full_name || 'Usuário desconhecido'
                          : <span className="text-red-600">Órfã</span>
                        }
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Criado em:</span>
                      <p className="text-gray-600">
                        {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <p className="text-gray-600">{instance.connection_status}</p>
                    </div>
                  </div>

                  {!instance.created_by_user_id && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <div className="flex items-center gap-2 text-red-800 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Instância órfã detectada</span>
                      </div>
                      <p className="text-red-700 text-xs mt-1">
                        Esta instância não possui um proprietário definido e deve ser investigada
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
