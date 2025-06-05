import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserCheck, Building2, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const VPSInstanceCorrection = () => {
  const [phoneFilter, setPhoneFilter] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Função para vincular instância órfã específica - CORRIGIDA
  const correctOrphanInstance = async () => {
    if (!instanceId.trim() || !userEmail.trim()) {
      toast.error('Preencha o ID da instância e o email do usuário');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Instance Correction] 🔧 Vinculando instância órfã:', { instanceId, userEmail });

      // CORREÇÃO: Usar parâmetros corretos para vinculação por ID específico
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'bind_instance_to_user',
          instanceData: {
            instanceId: instanceId.trim(),
            userEmail: userEmail.trim()
          }
        }
      });

      if (error) {
        console.error('[Instance Correction] ❌ Erro na edge function:', error);
        throw error;
      }

      console.log('[Instance Correction] ✅ Resposta da vinculação:', data);

      if (data.success) {
        toast.success(`Instância órfã vinculada com sucesso ao usuário ${data.user?.name || userEmail}`);
        
        // Limpar campos após sucesso
        setInstanceId('');
        setUserEmail('');
      } else {
        toast.error('Falha na vinculação: ' + data.error);
      }
    } catch (error: any) {
      console.error('[Instance Correction] 💥 Erro inesperado:', error);
      toast.error('Erro ao vincular instância órfã: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const correctInstanceBinding = async () => {
    if (!phoneFilter.trim() || !userEmail.trim()) {
      toast.error('Preencha o telefone e o email do usuário');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Instance Correction] 🔧 Iniciando correção manual:', { phoneFilter, userEmail });

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'bind_instance_to_user',
          phoneFilter: phoneFilter.trim(),
          userEmail: userEmail.trim()
        }
      });

      if (error) {
        console.error('[Instance Correction] ❌ Erro na edge function:', error);
        throw error;
      }

      console.log('[Instance Correction] ✅ Resposta da correção:', data);

      if (data.success) {
        toast.success(`Instância vinculada com sucesso ao usuário ${data.user?.name} (${data.user?.company})`);
        
        // Limpar campos após sucesso
        setPhoneFilter('');
        setUserEmail('');
      } else {
        toast.error('Falha na correção: ' + data.error);
      }
    } catch (error: any) {
      console.error('[Instance Correction] 💥 Erro inesperado:', error);
      toast.error('Erro ao corrigir vinculação: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setTimeout(() => setShowDeleteConfirm(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Correção de Instância Órfã */}
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Vincular Instância Órfã Específica
          </CardTitle>
          <p className="text-sm text-gray-600">
            Para vincular uma instância órfã conhecida diretamente a um usuário
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="instanceId">ID da Instância Órfã</Label>
              <Input
                id="instanceId"
                placeholder="Ex: whatsapp_1749135571800_dzed96mr7"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="userEmailOrphan">Email do Usuário</Label>
              <Input
                id="userEmailOrphan"
                type="email"
                placeholder="digitalticlin@gmail.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <Button 
              onClick={correctOrphanInstance}
              disabled={isLoading || !instanceId.trim() || !userEmail.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  Vinculando...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Vincular Instância Órfã
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Correção Manual por Telefone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Correção Manual de Vinculação por Telefone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phoneFilter">Filtro de Telefone</Label>
              <Input
                id="phoneFilter"
                placeholder="Ex: 8888 (parte do telefone)"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="userEmail">Email do Usuário</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="usuario@empresa.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <Button 
              onClick={correctInstanceBinding}
              disabled={isLoading || !phoneFilter.trim() || !userEmail.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  Corrigindo...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Corrigir Vinculação
                </>
              )}
            </Button>

            {/* BLINDAGEM: Botão de exclusão protegido */}
            <div className="mt-6 p-4 border border-orange-200 rounded-lg bg-orange-50">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Área Protegida</span>
              </div>
              <p className="text-xs text-orange-700 mb-3">
                Exclusão de instâncias é uma operação crítica que pode causar perda de dados.
              </p>
              
              {!showDeleteConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Solicitar Exclusão
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ Função de exclusão bloqueada por segurança
                  </p>
                  <p className="text-xs text-gray-600">
                    Entre em contato com o administrador do sistema para exclusões.
                  </p>
                </div>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Exemplo de uso:</strong></p>
              <p>• Telefone: "8888" → busca instâncias com telefone contendo 8888</p>
              <p>• Email: "usuario@empresa.com" → vincula à empresa deste usuário</p>
              <p>• A instância será renomeada automaticamente baseada no username</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
