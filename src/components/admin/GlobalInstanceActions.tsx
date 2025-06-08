
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Link, 
  User, 
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Instance {
  id: string;
  instance_name: string;
  vps_instance_id: string;
  phone?: string;
  profile_name?: string;
  connection_status: string;
  created_by_user_id?: string;
  company_id?: string;
}

interface GlobalInstanceActionsProps {
  instance: Instance;
  onRefresh: () => void;
}

export const GlobalInstanceActions = ({ instance, onRefresh }: GlobalInstanceActionsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
      case 'open':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'connecting':
      case 'waiting_scan':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
      case 'open':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'waiting_scan':
        return 'Aguardando QR';
      default:
        return 'Desconectado';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ready':
      case 'open':
        return 'default';
      case 'connecting':
      case 'waiting_scan':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Confirma a exclusão da instância "${instance.instance_name}"?\n\nEla será removida tanto do Supabase quanto da VPS.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      console.log('[Global Actions] 🗑️ Excluindo instância:', instance.vps_instance_id);

      // Deletar da VPS via edge function
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'delete_vps_instance_cleanup',
          instance_name: instance.instance_name,
          vps_instance_id: instance.vps_instance_id
        }
      });

      if (error) {
        console.error('[Global Actions] ❌ Erro na edge function:', error);
        toast.error('Erro ao deletar da VPS: ' + error.message);
        return;
      }

      if (!data?.success) {
        console.error('[Global Actions] ❌ Falha na deleção:', data?.error);
        toast.error('Falha ao deletar: ' + (data?.error || 'Erro desconhecido'));
        return;
      }

      // Deletar do Supabase (o trigger já deve ter cuidado disso, mas garantir)
      const { error: dbError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instance.id);

      if (dbError) {
        console.warn('[Global Actions] ⚠️ Erro ao deletar do Supabase:', dbError);
        // Não bloquear, pode já ter sido deletada pelo trigger
      }

      console.log('[Global Actions] ✅ Instância deletada com sucesso');
      toast.success('Instância excluída da VPS e Supabase!');
      onRefresh();

    } catch (error: any) {
      console.error('[Global Actions] 💥 Erro inesperado:', error);
      toast.error('Erro inesperado: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLink = async () => {
    if (!userEmail.trim()) {
      toast.error('Digite o email do usuário');
      return;
    }

    setIsLinking(true);
    try {
      console.log('[Global Actions] 🔗 Vinculando instância:', { 
        instanceId: instance.vps_instance_id, 
        userEmail 
      });

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'bind_instance_to_user',
          instanceData: {
            instanceId: instance.vps_instance_id,
            userEmail: userEmail.trim(),
            instanceName: instance.instance_name
          }
        }
      });

      if (error) {
        console.error('[Global Actions] ❌ Erro na edge function:', error);
        toast.error('Erro ao vincular: ' + error.message);
        return;
      }

      if (!data?.success) {
        console.error('[Global Actions] ❌ Falha na vinculação:', data?.error);
        toast.error('Falha na vinculação: ' + (data?.error || 'Erro desconhecido'));
        return;
      }

      console.log('[Global Actions] ✅ Vinculação realizada:', data);
      toast.success(`Instância vinculada ao usuário ${data.user?.name || userEmail}!`);
      
      setLinkDialogOpen(false);
      setUserEmail('');
      onRefresh();

    } catch (error: any) {
      console.error('[Global Actions] 💥 Erro inesperado:', error);
      toast.error('Erro inesperado: ' + error.message);
    } finally {
      setIsLinking(false);
    }
  };

  const isOrphan = !instance.created_by_user_id;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3">
        {getStatusIcon(instance.connection_status)}
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium">{instance.instance_name}</p>
            {isOrphan && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <User className="h-3 w-3 mr-1" />
                Órfã
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>VPS ID: {instance.vps_instance_id}</p>
            <p>Telefone: {instance.phone || 'Não configurado'}</p>
            <p>Perfil: {instance.profile_name || 'Sem nome'}</p>
            {instance.created_by_user_id && (
              <p>Creator: {instance.created_by_user_id.slice(0, 8)}...</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2">
        <Badge variant={getStatusVariant(instance.connection_status)}>
          {getStatusText(instance.connection_status)}
        </Badge>
        
        <div className="flex gap-1">
          {/* Botão Vincular - Disponível para órfãs */}
          {isOrphan && (
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLinking}
                  className="h-8 w-8 p-0"
                >
                  {isLinking ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Link className="h-3 w-3" />
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Vincular Instância ao Usuário</DialogTitle>
                  <DialogDescription>
                    Digite o email do usuário para vincular esta instância órfã.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="userEmail">Email do Usuário</Label>
                    <Input
                      id="userEmail"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="usuario@exemplo.com"
                      disabled={isLinking}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setLinkDialogOpen(false)}
                      disabled={isLinking}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleLink}
                      disabled={isLinking || !userEmail.trim()}
                    >
                      {isLinking ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Vinculando...
                        </>
                      ) : (
                        <>
                          <Link className="h-4 w-4 mr-2" />
                          Vincular
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Botão Excluir - Sempre disponível */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 p-0"
          >
            {isDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
