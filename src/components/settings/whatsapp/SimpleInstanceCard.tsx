
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Trash2, Phone, CheckCircle, Clock, AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { toast } from "sonner";

interface SimpleInstanceCardProps {
  instance: WhatsAppWebInstance;
  onGenerateQR: (instanceId: string, instanceName: string) => Promise<void>;
  onDelete: (instanceId: string) => Promise<void>;
  onRefreshQRCode: (instanceId: string) => Promise<{ qrCode?: string } | null>;
}

export const SimpleInstanceCard = ({
  instance,
  onGenerateQR,
  onDelete,
  onRefreshQRCode
}: SimpleInstanceCardProps) => {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusInfo = () => {
    // CORREÇÃO: Incluir instâncias com erro para permitir retry
    if (instance.connection_status === 'connected' || instance.connection_status === 'open') {
      return {
        label: 'Conectado',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200',
        canRetry: false
      };
    }
    
    if (instance.web_status === 'waiting_scan' && instance.qr_code) {
      return {
        label: 'Aguardando Scan',
        icon: QrCode,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        canRetry: false
      };
    }
    
    if (instance.web_status === 'connecting' || instance.connection_status === 'connecting') {
      return {
        label: 'Conectando',
        icon: Clock,
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        canRetry: false
      };
    }

    // CORREÇÃO: Exibir instâncias com erro e permitir retry
    if (instance.web_status === 'error' || instance.connection_status === 'error') {
      return {
        label: 'Erro - Tentar Novamente',
        icon: AlertTriangle,
        color: 'bg-red-100 text-red-800 border-red-200',
        canRetry: true
      };
    }
    
    return {
      label: 'Desconectado',
      icon: AlertCircle,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      canRetry: true
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    try {
      await onGenerateQR(instance.id, instance.instance_name);
    } catch (error: any) {
      toast.error(`Erro ao gerar QR Code: ${error.message}`);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja deletar a instância "${instance.instance_name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(instance.id);
        toast.success('Instância deletada com sucesso');
      } catch (error: any) {
        toast.error(`Erro ao deletar instância: ${error.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1
      bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl 
      border border-white/30 rounded-2xl overflow-hidden">
      
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-2">{instance.instance_name}</h3>
            
            <Badge className={`${statusInfo.color} border`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>

            {/* CORREÇÃO: Mostrar informações da VPS se disponível */}
            {instance.vps_instance_id && (
              <p className="text-xs text-gray-500 mt-1">
                VPS ID: {instance.vps_instance_id.substring(0, 8)}...
              </p>
            )}
          </div>
        </div>

        {instance.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{instance.phone}</span>
          </div>
        )}

        {/* CORREÇÃO: Mostrar detalhes do erro se houver */}
        {statusInfo.canRetry && (
          <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700">
              💡 Esta instância teve problemas na criação. Tente gerar o QR Code novamente.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {/* CORREÇÃO: Permitir gerar QR Code mesmo para instâncias com erro */}
          {(instance.connection_status !== 'connected' && instance.connection_status !== 'open') && (
            <Button
              onClick={handleGenerateQR}
              disabled={isGeneratingQR}
              size="sm"
              className={`flex-1 ${statusInfo.canRetry ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
              {isGeneratingQR ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  {statusInfo.canRetry ? 'Tentar Novamente' : 'Gerar QR Code'}
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
