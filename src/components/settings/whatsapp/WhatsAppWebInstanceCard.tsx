
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, QrCode, Eye } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { InstanceProfileSection } from "./InstanceProfileSection";
import { InstanceStatusMessages } from "./InstanceStatusMessages";

interface WhatsAppWebInstanceCardProps {
  instance: WhatsAppWebInstance;
  onDelete: (instanceId: string) => void;
  onGenerateQR: (instanceId: string) => void;
  onShowQR: () => void;
  isNewInstance?: boolean;
}

export function WhatsAppWebInstanceCard({
  instance,
  onDelete,
  onGenerateQR,
  onShowQR,
  isNewInstance = false
}: WhatsAppWebInstanceCardProps) {
  const isConnected = instance.connection_status === 'connected' || 
                     instance.connection_status === 'ready' || 
                     instance.connection_status === 'open';

  const hasQRCode = instance.qr_code && instance.qr_code.trim() !== '';

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg bg-white/30 backdrop-blur-xl border border-white/30 rounded-3xl ${
      isConnected ? 'border-green-300 bg-green-50/20' : ''
    }`}>
      <CardHeader className="pb-3">
        <InstanceProfileSection instance={instance} />
      </CardHeader>

      <CardContent className="space-y-3">
        <InstanceStatusMessages
          connectionStatus={instance.connection_status}
          qrCode={instance.qr_code}
          isNewInstance={isNewInstance}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              disabled
            >
              ✅ Conectado
            </Button>
          ) : hasQRCode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowQR}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver QR Code
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerateQR(instance.id)}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <QrCode className="h-4 w-4 mr-1" />
              Gerar QR Code
            </Button>
          )}
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(instance.id)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
