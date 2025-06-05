
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Search, Link, Users, Building2 } from "lucide-react";

interface OrphanInstance {
  id: string;
  instance_name: string;
  vps_instance_id: string;
  phone: string | null;
  profile_name: string | null;
  connection_status: string;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  active: boolean;
}

export const OrphanInstanceLinker = () => {
  const [orphanInstances, setOrphanInstances] = useState<OrphanInstance[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);

  const fetchOrphanInstances = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .is('company_id', null)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrphanInstances(data || []);
    } catch (error) {
      console.error('Erro ao buscar instâncias órfãs:', error);
      toast.error('Erro ao carregar instâncias órfãs');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, active')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      toast.error('Erro ao carregar empresas');
    }
  };

  useEffect(() => {
    fetchOrphanInstances();
    fetchCompanies();
  }, []);

  const filteredInstances = orphanInstances.filter(instance =>
    instance.instance_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (instance.phone && instance.phone.includes(searchTerm)) ||
    (instance.profile_name && instance.profile_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectInstance = (instanceId: string) => {
    setSelectedInstances(prev => 
      prev.includes(instanceId) 
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  const handleLinkInstances = async () => {
    if (!selectedCompany || selectedInstances.length === 0) {
      toast.error('Selecione uma empresa e pelo menos uma instância');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ company_id: selectedCompany })
        .in('id', selectedInstances);

      if (error) throw error;

      toast.success(`${selectedInstances.length} instância(s) vinculada(s) com sucesso!`);
      setSelectedInstances([]);
      setSelectedCompany("");
      fetchOrphanInstances(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao vincular instâncias:', error);
      toast.error('Erro ao vincular instâncias');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-orange-600" />
            Vincular Instâncias Órfãs ({orphanInstances.length})
          </CardTitle>
          <p className="text-sm text-gray-600">
            Vincule instâncias que foram sincronizadas da VPS mas ainda não estão associadas a uma empresa
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de busca e vinculação */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Buscar instâncias</label>
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
            <div className="flex-1">
              <label className="text-sm font-medium">Empresa</label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {company.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleLinkInstances}
              disabled={loading || !selectedCompany || selectedInstances.length === 0}
              className="gap-2"
            >
              <Link className="h-4 w-4" />
              Vincular ({selectedInstances.length})
            </Button>
          </div>

          {/* Lista de instâncias órfãs */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : filteredInstances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {orphanInstances.length === 0 ? (
                  <>
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    Nenhuma instância órfã encontrada!
                  </>
                ) : (
                  'Nenhuma instância encontrada com o filtro atual'
                )}
              </div>
            ) : (
              filteredInstances.map(instance => (
                <div
                  key={instance.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedInstances.includes(instance.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectInstance(instance.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{instance.instance_name}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(instance.connection_status)} text-white`}
                        >
                          {instance.connection_status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">VPS ID:</span> {instance.vps_instance_id}
                        </div>
                        <div>
                          <span className="font-medium">Telefone:</span> {instance.phone || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Perfil:</span> {instance.profile_name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Criado:</span> {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={selectedInstances.includes(instance.id)}
                        onChange={() => handleSelectInstance(instance.id)}
                        className="h-4 w-4 text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
