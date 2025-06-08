
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Trash2, Loader2, Smartphone, CheckCircle, Clock } from "lucide-react";
import { InstanceStatusBadge } from "./InstanceStatusBadge";
import { InstanceStatusMessages } from "./InstanceStatusMessages";

interface SimpleInstanceCardProps {
  instance: any;
  onGenerateQR: (instanceId: string, instanceName: string) => void;
  onDelete: (instanceId: string) => void;
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

  const isConnected = instance.connection_status === 'connected' || 
                     instance.connection_status === 'ready' || 
                     instance.connection_status === 'open';

  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    try {
      await onGenerateQR(instance.id, instance.instance_name);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja deletar a instância "${instance.instance_name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(instance.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl hover:bg-white/30 transition-all duration-300 shadow-lg">
      <CardContent className="p-6">
        {/* Header com nome e status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-2 truncate">
              {instance.instance_name}
            </h3>
            <InstanceStatusBadge status={instance.connection_status} />
          </div>
          
          {isConnected && (
            <div className="ml-2">
              <Smartphone className="h-5 w-5 text-green-600" />
            </div>
          )}
        </div>

        {/* Informações da instância */}
        <div className="space-y-3 mb-4">
          {instance.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Telefone:</span>
              <span>{instance.phone}</span>
            </div>
          )}
          
          {instance.profile_name && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Perfil:</span>
              <span className="truncate">{instance.profile_name}</span>
            </div>
          )}
        </div>

        {/* Status messages */}
        <div className="mb-4">
          <InstanceStatusMessages 
            connectionStatus={instance.connection_status}
            qrCode={instance.qr_code}
          />
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          {!isConnected && (
            <Button
              onClick={handleGenerateQR}
              disabled={isGeneratingQR}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              {isGeneratingQR ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Gerar QR
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
            size="sm"
            className={isConnected ? "flex-1" : ""}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {!isConnected && <span className="ml-2">Deletar</span>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
