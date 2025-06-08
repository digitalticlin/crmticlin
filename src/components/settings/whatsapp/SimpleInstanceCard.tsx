
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { InstanceCardContent } from "./instance/InstanceCardContent";
import { InstanceCardActions } from "./instance/InstanceCardActions";
import { getStatusInfo } from "./instance/InstanceStatusInfo";
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

  const statusInfo = getStatusInfo(instance);

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
    if (window.confirm(`Tem certeza que deseja deletar "${instance.instance_name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(instance.id);
        toast.success('Instância deletada com sucesso');
      } catch (error: any) {
        toast.error(`Erro ao deletar: ${error.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 
      bg-gradient-to-br ${statusInfo.bgGradient} backdrop-blur-xl 
      border border-white/40 rounded-3xl min-h-[320px]
      before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none`}>
      
      <CardContent className="relative z-10 p-8 h-full flex flex-col">
        <InstanceCardContent instance={instance} />
        
        <InstanceCardActions 
          instance={instance}
          isGeneratingQR={isGeneratingQR}
          isDeleting={isDeleting}
          onGenerateQR={handleGenerateQR}
          onDelete={handleDelete}
        />
      </CardContent>
    </Card>
  );
};
