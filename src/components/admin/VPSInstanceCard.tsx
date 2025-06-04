
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Phone, 
  User, 
  Building2, 
  MoreHorizontal,
  Zap,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface VPSInstanceCardProps {
  instance: {
    instanceId: string;
    status: string;
    phone?: string;
    profileName?: string;
    profilePictureUrl?: string;
    isOrphan: boolean;
    companyName?: string;
    userName?: string;
    lastSeen?: string;
  };
  onRefresh: () => void;
}

export const VPSInstanceCard = ({ instance, onRefresh }: VPSInstanceCardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const getStatusBadge = (status: string, isOrphan: boolean) => {
    if (isOrphan) {
      return <Badge variant="destructive">Órfã</Badge>;
    }
    
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-green-600">Ativa</Badge>;
      case 'ready':
        return <Badge variant="secondary">Pronta</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Desconectada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleReconnect = async () => {
    setIsLoading(true);
    try {
      // Implementar reconexão via edge function
      toast.success('Tentativa de reconexão iniciada');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao tentar reconectar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar esta instância?')) return;
    
    setIsLoading(true);
    try {
      // Implementar deleção via edge function
      toast.success('Instância deletada com sucesso');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao deletar instância');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      {/* Barra de status colorida */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        instance.isOrphan ? 'bg-red-500' : 
        instance.status === 'open' ? 'bg-green-500' : 'bg-gray-400'
      }`} />
      
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span className="truncate font-mono">
              {instance.instanceId.slice(-8)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge(instance.status, instance.isOrphan)}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {}}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReconnect} disabled={isLoading}>
                  <Zap className="mr-2 h-4 w-4" />
                  Reconectar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete} 
                  disabled={isLoading}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Informações do WhatsApp */}
        {instance.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{instance.phone}</span>
          </div>
        )}
        
        {instance.profileName && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{instance.profileName}</span>
          </div>
        )}
        
        {/* Informações da Empresa/Usuário */}
        {!instance.isOrphan && (
          <>
            {instance.companyName && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{instance.companyName}</span>
              </div>
            )}
            
            {instance.userName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{instance.userName}</span>
              </div>
            )}
          </>
        )}
        
        {/* Última atualização */}
        {instance.lastSeen && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Última atividade: {new Date(instance.lastSeen).toLocaleString()}
          </div>
        )}
        
        {/* Estado órfã */}
        {instance.isOrphan && (
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
            ⚠️ Instância órfã - não vinculada a nenhum usuário
          </div>
        )}
      </CardContent>
    </Card>
  );
};
