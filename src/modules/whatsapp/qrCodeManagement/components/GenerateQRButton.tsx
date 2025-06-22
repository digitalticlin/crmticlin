
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, Loader2 } from "lucide-react";
import { useQRCodeGeneration } from '../hooks/useQRCodeGeneration';

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
  const { generateQRCode, isGenerating } = useQRCodeGeneration({
    onSuccess,
    onModalOpen
  });

  const handleGenerateQR = async () => {
    await generateQRCode(instanceId);
    
    // Chamar onModalOpen após gerar QR Code se foi fornecido
    if (onModalOpen) {
      onModalOpen(instanceId, instanceName);
    }
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
      {isGenerating ? 'Gerando...' : 'Gerar QR Code'}
    </Button>
  );
};
