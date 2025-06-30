import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, Loader2 } from "lucide-react";
import { useSmartQRGeneration } from '../hooks/useSmartQRGeneration';

interface GenerateQRButtonProps {
  instanceId: string;
  instanceName?: string;
  onSuccess?: () => void;
  onModalOpen?: (instanceId: string, instanceName: string) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const GenerateQRButton = ({ 
  instanceId,
  instanceName = "instância",
  onSuccess,
  onModalOpen,
  variant = "outline",
  size = "sm",
  className = ""
}: GenerateQRButtonProps) => {
  const { generateSmartQR, isGenerating, status } = useSmartQRGeneration({
    onSuccess,
    onModalOpen
  });

  const handleGenerateQR = async () => {
    await generateSmartQR(instanceId, instanceName);
  };

  return (
    <Button
      onClick={handleGenerateQR}
      disabled={isGenerating}
      variant={variant}
      size={size}
      className={`bg-green-50 border-green-200 text-green-700 hover:bg-green-100 ${className}`}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <QrCode className="h-4 w-4 mr-1" />
      )}
      {isGenerating ? (status || 'Processando...') : 'Gerar QR Code'}
    </Button>
  );
};
